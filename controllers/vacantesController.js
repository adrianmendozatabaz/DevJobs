//importar el modelo
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const {
    body,
    validationResult
} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');


exports.formularioNuevaVacante = (req, res) =>{
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

//agrega las vacantes a la base de datos
exports.agregarVacante = async (req, res) => {
    const vacante = new Vacante(req.body);

    //usuario autor de la vacante
    vacante.autor = req.user._id;
    
    //crear arreglo de skills
    vacante.skills = req.body.skills.split(',');

    //almacenar en la base de datos 
    const nuevaVacante = await vacante.save();

    //redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`);
}

//muestra una vacante
exports.mostrarVacante = async (req, res, next) =>{
    const vacante = await Vacante.findOne({url: req.params.url}).populate('autor');

    //si no hay resultados
    if(!vacante) return next();

    //si hay pasar los resultados
    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })
}

//editar vacante
exports.formEditarVacante = async (req, res, next) => {
    const vacante = await Vacante.findOne({ url: req.params.url });

    //si no existe la vacante
    if(!vacante) return next();

    //si existe la vacante
    res.render('editar-vacante',{
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.editarVacante = async (req, res) => {
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, vacanteActualizada, {
        new: true,
        runValidators: true
    });

    res.redirect(`/vacantes/${vacante.url}`);
}

// Validar y Sanitizar los campos de las nuevas vacantes
exports.validarVacante = async (req, res, next) =>{
    //sanitizar y validar los campos
    const rules = [
        body('titulo').not().isEmpty().withMessage('Agrega un titulo a la vacante').trim().escape(),
        body('empresa').not().isEmpty().withMessage('Agrega una empresa').trim().escape(),
        body('ubicacion').not().isEmpty().withMessage('Agrega una ubicación').trim().escape(),
        body('contrato').not().isEmpty().withMessage('Agrega un tipo de contrato').escape(),
        body('skills').not().isEmpty().withMessage('Agrega al menos una habilidad').escape(),
        body('salario').escape()
    ];

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if(!errores.isEmpty()){
        //Recargar la vista con los errores
        req.flash('error', errores.array().map(error => error.msg));
        res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
    }

    // si no hay errores siguiente middleware
    next();
}

exports.eliminarVacante = async (req, res, next) =>{
    const {id} = req.params;

    const vacante = await Vacante.findById(id);

    if(verificarAutor(vacante, req.user)){
        //Si eliminar
        vacante.remove();
        res.status(200).send('Vacante eliminada correctamente.')
    } else{
        //no permitido
        res.status(403).send('Error');
    }

    
}

const verificarAutor = (vacante = {}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }
    return true;
}

//subir archivos en pdf
exports.subirCV =  (req, res, next) => {
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
            res.redirect('back');
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
            cb(null, __dirname + '../../public/uploads/cv');
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            //callback true : aceptado
            cb(null, true);
        } else {
            cb(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('cv');


exports.contactar = async (req, res, next) =>{
    //almacenar los candidatos en la bd
    const vacante = await Vacante.findOne({ url: req.params.url});

    //sino existe la vacante 
    if(!vacante) return next();

    //si existe, construir el nuevo objeto
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    //almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    //mensaje flash y rideccion
    req.flash('correcto', 'Se envio tu Curriculum Correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async (req, res, next) =>{
    const vacante = await Vacante.findById(req.params.id);
    //verificar que el autor sea el mismo que esta logeado
    if(vacante.autor != req.user._id.toString()){
        return next()
    }
    //verificar si hay vacantes
    if(!vacante) return next();

    //si hay vacantes mostrar
    res.render('candidatos',{
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}


//buscador de vacantes
exports.buscarVacante = async (req, res) =>{
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    })

    //mostrar las vacantes
    res.render('home',{
        nombrePagina: `Resultados para la busqueda : ${req.body.q}`,
        barra: true,
        vacantes
    })
}