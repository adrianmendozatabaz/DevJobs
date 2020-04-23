//aqui se guarda la configuracion de las rutas

//importaciones librerias
const express = require('express');
const router = express.Router();

//importaciones de controllers
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');


module.exports = () =>{
    router.get('/', homeController.mostrarTrabajos);

    //crear vacantes
    router.get('/vacantes/nueva', vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', vacantesController.agregarVacante);

    //Mostrar vacante
    router.get('/vacantes/:url', vacantesController.mostrarVacante);

    //editar vacante 
    router.get('/vacantes/editar/:url', vacantesController.formEditarVacante);
    router.post('/vacantes/editar/:url', vacantesController.editarVacante);

    //crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', 
        usuariosController.validarRegistro,    
        usuariosController.crearUsuario
    );
    
    //autenticar usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    return router;
}