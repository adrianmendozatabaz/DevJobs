const emailConfig = require('../config/email');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const util = require('util');

let transport = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
    }
})

//utilizar templates de handlebars
const handlebarOptions = {
    viewEngine: {
      extName: '.handlebars',
      partialsDir: 'views/emails',
      layoutsDir: 'views/emails',
      defaultLayout: 'reset.handlebars',
    },
    viewPath: 'views/emails',
    extName: '.handlebars',
  };
   
transport.use('compile', hbs(handlebarOptions));

exports.enviar = async(opciones) => {
    const opcionesEmail = {
        from: 'devJobs<noreply@devjobs.com',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        context: {
            resetUrl: opciones.resetUrl
        }
    }

    const sendMail = util.promisify(transport.sendMail, transport);
    return sendMail.call(transport, opcionesEmail);
}