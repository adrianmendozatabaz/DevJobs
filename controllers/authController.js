const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos Campos Son Obligatorios'
});

//Revisar si el usuario esta autenticado 
exports.verificarUsuario = (req, res, next) =>{
    //revisar el usuario
    if(req.isAuthenticated()){
        //el usuario esta autenticado
        return next();
    }

    //redireccionar
    res.redirect('/iniciar-sesion')
}

exports.mostrarPanel = async (req, res) =>{

    //consultar el usuario autenticado
    const vacantes = await Vacante.find({ autor: req.user._id })

    res.render('administracion', {
        nombrePagina: 'Panel de Administración',
        tagline: 'Crea y Administra tus vacantes desde aquí',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res) =>{
    req.logout();

    req.flash('correcto', 'Cerraste Sesión Correctamente');
    return res.redirect('/iniciar-sesion');
}

//formulario para reiniciar el password
exports.formReestablecerPassword = (req, res) =>{
    res.render('reestablecer-password', {
        nombrePagina: 'Reestablece tu Password',
        tagline: 'Si ya tienes una cuenta pero olvidate tu password, coloca tu email'
    })
}

//genera el token en la tabla del usuario
exports.enviarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({email: req.body.email});
    //si no existe
    if(!usuario){
        req.flash('error', 'No existe esa cuenta');
        return res.redirect('/iniciar-sesion');
    }
    //el usuario existe generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;
    //guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;
    
    //hacer el envio de email
    await enviarEmail.enviar({
        usuario,
        subjet: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    })

    //todo correcto
    req.flash('correcto', 'Revisa tu email para las indicaciones');
    res.redirect('/iniciar-sesion');
}

//valida si el token es valido y el usuario existe muestra la vista
exports.reestablecerPassword = async (req, res) =>{
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira:{
            $gt: Date.now()
        }
    });

    //si no existe
    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta nuevamente');
        return res.redirect('/reestablecer-password');
    }

    //todo bien
    res.render('nuevo-password',{
        nombrePagina: 'Nuevo Password'
    })
}

//almacena el nuevo password en la base de datos
exports.guardarPassword = async (req, res) =>{
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira:{
            $gt: Date.now()
        }
    });
    
    //no existe el usuario o el token es invalido
    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta nuevamente');
        return res.redirect('/reestablecer-password');
    }

    //todo corecto guardar en la bd
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    //guardar en la bd
    await usuario.save();

    //redirigir 
    req.flash('correcto', 'Password Modificado Correctamente');
    res.redirect('/iniciar-sesion');
}