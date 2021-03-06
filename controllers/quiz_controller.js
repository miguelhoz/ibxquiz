var models = require('../models/models.js');
var constantes = models.Constantes;

// Autoload - factoriza req.quiz si ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
    models.Quiz.find({
        where: {
            id: Number(quizId)
        },
        include: [models.Comment]
    }).then(
        function(quiz) {
            if (quiz) {
                req.quiz = quiz;
                next();
            } else {
                next(new Error('No existe quizId=' + quizId));
            }
        }
    ).catch(function(error) {
        console.error(error);
        next(error);
    });
};

// GET home_page
exports.home = function(req, res) {
    res.render('index', {
        title: constantes.TITULO,
        errors: null
    });
};

// GET About us
exports.author = function(req, res) {
    res.render('author', {
        title: constantes.TITULO,
        author: constantes.AUTHORNAME,
        nick: constantes.AUTHORNICK,
        imagen: constantes.AUTHORIMG,
        errors: null
    });
};


//GET /quizes && /quizes/:buscar
exports.index = function(req, res) {
    var sqlBuscar;
    var cadenaBusca = "";
    var soloTema = "";
    if ( (req.query.buscar !== "" && req.query.buscar !== undefined) || (req.query.verTema !== "" && req.query.verTema !== undefined)) {
        cadenaBusca = cadenaBusca + req.query.buscar.trim();
        //escapa caracteres reservados de expresiones regulares
        cadenaBusca = cadenaBusca.replace(/([\$\(\)\*\+\.\[\]\?\\\/\^\{\}\|])/g, "\\$1");
        //Sustituye los espacios inermedios por %
        cadenaBusca = cadenaBusca.replace(/\s+/g, "%");
        //Añadimos los % en los extremos
        cadenaBusca = "%" + cadenaBusca + "%";
        console.log('cadenaBusca: ' + cadenaBusca);

        //Ahora vemos si hay filtro por tema
        soloTema = soloTema + req.query.verTema.trim();
        //escapa caracteres reservados de expresiones regulares
        soloTema = soloTema.replace(/([\$\(\)\*\+\.\[\]\?\\\/\^\{\}\|])/g, "\\$1");
        //Sustituye los espacios inermedios por %
        soloTema = soloTema.replace(/\s+/g, "%");
        //Añadimos los % en los extremos
        soloTema = "%" + soloTema + "%";
        // Ahora montamos los parametros de Sequelize
        sqlBuscar = {
            where: ["upper(pregunta) like upper(?) and upper(tema) like upper(?)", cadenaBusca, soloTema],
            order: "tema ASC, pregunta ASC"
        };
    } else {
        sqlBuscar = {
            where: ["1=1"],
            order: "tema ASC, pregunta ASC"
        };
    }
    console.log(sqlBuscar);

    // Finalmente realizamos la busqueda en bbdd
    models.Quiz.findAll(sqlBuscar).then(
        function(quizes) {

            res.render('quizes/index', {
                title: constantes.TITULO,
                quizes: quizes,
                errors: null
            });
        }
    ).catch(function(error) {
        next(error);
    });
};

//GET /quizes/show
exports.show = function(req, res) {
    console.log('Mostrando el quiz:\n' + JSON.stringify(req.quiz));
    res.render('quizes/show', {
        title: constantes.TITULO,
        quiz: req.quiz,
        errors: null
    });
};

//GET /quizes/answer
exports.answer = function(req, res) {
    var vResultado = 'Wrong';
    if (req.query.respuesta) {
        var laRespuesta = req.query.respuesta;
        //escapa caracteres reservados de expresiones regulares
        laRespuesta = laRespuesta.replace(/([\$\(\)\*\+\.\[\]\?\\\/\^\{\}\|])/g, "\\$1");
        models.Quiz.find(req.params.quizId).then(function(quiz) {
            if (laRespuesta.toUpperCase() === req.quiz.respuesta.toUpperCase()) {
                vResultado = 'Correct';
            }
            res.render('quizes/answer', {
                title: constantes.TITULO,
                resultado: vResultado,
                respuesta: laRespuesta,
                quiz: req.quiz,
                errors: null
            });
        });
     } else {
         res.render('quizes/show', {
             title: constantes.TITULO,
             quiz: req.quiz,
             errors: {'ERROR:': 'No has respondido nada'}
         });
     }
};

// GET /quizes/new
exports.new = function(req, res) {
    var quiz = models.Quiz.build({
        pregunta: "Tu pregunta",
        respuesta: "La respuesta"
    });
    res.render('quizes/new', {
        title: constantes.TITULO,
        quiz: quiz,
        errors: null
    });
};

// POST /quizes/create
exports.create = function(req, res, err) {
    quiz = models.Quiz.build(req.body.quiz);
    // Guardamos la nueva pregunta
    quiz.save({
        fields: ["pregunta", "respuesta", "tema"]
    }).then(function() {
        //Y redireccionamos a la lista de preguntas
        console.log('Pregunta creada:\n' + quiz);
        res.redirect('/quizes');
    }).catch(function(err) {
        console.log('No se ha creado la pregunta:\n' + quiz);
        console.error(err);
        res.render('quizes/new', {
            title: constantes.TITULO,
            errors: err,
            quiz: quiz
        });
    });
};

// GET quizes/:quizId/edit
exports.edit = function(req, res) {
    var quiz = req.quiz; //Ya cargado en el Autoload
    res.render('quizes/edit', {
        title: constantes.TITULO,
        quiz: quiz,
        errors: null
    });
};

// PUT /quizes/:quizId
exports.update = function(req, res) {
    req.quiz.pregunta = req.body.quiz.pregunta;
    req.quiz.respuesta = req.body.quiz.respuesta;
    req.quiz.tema = req.body.quiz.tema;
    // Ahora guardamos
    req.quiz
        .save({
            fields: ["pregunta", "respuesta", "tema"]
        }).then(function() {
            //Y redireccionamos a la lista de preguntas
            console.log('Pregunta actualizada:\n' + JSON.stringify(req.quiz));
            res.redirect('/quizes');
        }).catch(function(err) {
            console.log('No se ha actualizado la pregunta:\n' + JSON.stringify(req.quiz));
            console.error(err);
            res.render('quizes/edit', {
                title: constantes.TITULO,
                errors: err,
                quiz: req.quiz
            });
        });
};

// DELETE /quizes/:quizId
exports.borrar = function(req, res) {
    req.quiz
        .destroy()
        .then(function() {
            console.log('Pregunta borrada:\n' + quiz);
            res.redirect('/quizes');
        }).catch(function(error) {
            console.error(error);
            next(error);
        });
};
