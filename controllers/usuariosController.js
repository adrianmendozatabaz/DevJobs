//importaciones
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const {
    body,
    validationResult
} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
    upload(req, res, function (error) {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El archivo es muy grande max 100kb');
                } else {
                    req.flash('error', error.message)
                }
            } else {
                req.flash('error', error.message);
            }
            res.redirect('/administracion');
            return;
        } else {
            return next();
        }
    })
}

//opciones de multer
const configuracionMulter = {

    limits: {
        fileSize: 100000
    },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, __dirname + '../../public/uploads/perfiles')
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            //callback true : aceptado
            cb(null, true);
        } else {
            cb(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crea una cuenta en Devjobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}

exports.validarRegistro = async (req, res, next) => {
    //sanitizar los campos
    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail(),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        body('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ];

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }

    //si toda la validacion es correcta
    next();
}

exports.crearUsuario = async (req, res, next) => {
    const usuario = new Usuarios(req.body);

    //verificamos si podemos crear el usuario con la validacion
    try {
        await usuario.save();

        //si se crea correctamente
        res.redirect('/iniciar-sesion');
    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }
}

//formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesión DevJobs'
    })
}

//editar el perfil
exports.formEditarPerfil = (req, res) => {
    res.render('editar-perfil', {
        nombrePagina: 'Edita tu perfil en DevJobs',
        usuario: req.user,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

//guardar cambios editar perfil
exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if (req.body.password) {
        usuario.password = req.body.password
    }
    if (req.file) {
        usuario.imagen = req.file.filename;
    }

    await usuario.save();

    req.flash('correcto', 'Cambios Guardados Correctamente');
    //redireccionar
    res.redirect('/administracion');
}

//sanitizar y validar los campos de editar perfiles
exports.validarPerfil = async (req, res, next) => {
    //sanitizar y validar los campos
    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre no puede ir vacio').trim().escape(),
        body('email').isEmail().withMessage('Agrega un correo valido').normalizeEmail().escape()
    ];
    if (req.body.password) {
        rules.push(body('password').escape());
    }
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        //Recargar la vista con los errores
        req.flash('error', errores.array().map(error => error.msg));
        res.render('editar-perfil', {
            nombrePagina: 'Edita tu perfil en DevJobs',
            usuario: req.user,
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen,
            mensajes: req.flash()
        })
    }

    // si no hay errores siguiente middleware
    next();
}