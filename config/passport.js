const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},async (email, password, done) =>{
    const usuario = await Usuarios.findOne({ email });
    
    //si no hay usuario
    if(!usuario) return done(null, false, {
        message: 'Usuario No Existente'
    });

    //verificar el usuario y password
    const verificarPass = usuario.compararPassword(password);

    //si no es correcto el password
    if(!verificarPass) return done(null, false, {
        message: 'Password Incorrecto'
    });

    //el usuario existe y pass correcto
    return done(null, usuario);
}));

passport.serializeUser((usuario, done) => done(null, usuario._id));

passport.deserializeUser(async (id, done) => {
    const usuario = await Usuarios.findById(id);
    return done(null, usuario);
});

module.exports = passport;