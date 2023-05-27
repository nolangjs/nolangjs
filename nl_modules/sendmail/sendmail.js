const nodemailer = require('nodemailer');

/**
 * mailconfig like {
    host: 'smtp.site.ooo',
    port: 587,
    auth: {
        user: 'user',
        pass: 'Spass'
    },
    tls: {rejectUnauthorized: false},
    template: {
        path: 'absolute path to template file',
        values: {
            v1: 122,
            v2: 'dfasf'
        }
    }
}
 */

const transporter = nodemailer.createTransport({});

module.exports = {
    sendMail : async function() {
        let mailOptions = this.params;
        console.debug('sendMail',mailOptions)
        if(mailOptions?.template) {
            let fs = require('fs');
            let {join} = require('path');
            let template;
            fs.readFile(mailOptions.template.path, function (err, content) {
                if(err){
                    console.error('template path is false', err);
                    return;
                    // throw 'template path is false'
                }
                template = content.toString();
                for(let k in mailOptions.template.values){
                    template = template.replace(new RegExp('#'+k+'#', 'g') , mailOptions.template.values[k]);
                }
                mailOptions.html = template;
                send();
            })
        } else {
            send();
        }

        function send() {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    return error;
                } else {
                    console.log('Email sent: ' + info.response);
                    return 'OK';
                }
            });
        }


    }
}
