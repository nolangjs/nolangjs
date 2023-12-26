const nolang = {
    init() {
        this.initForms();
        this.initJalaliDatePickers();
    },
    runScript(script, page) {
        fetch("/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: typeof script === 'string' ? script : JSON.stringify(script),
        }).then(response=>{
            response.text().then(text=>{
                if(script.$$header?.debug)
                    console.log(script,text)
                if(script.$$header?.target) {
                    if(text.includes('$$target')) {
                        text = text.replaceAll('$$target', script.$$header?.target);
                        text = text.replaceAll('$$page', script.$$header?.page +1);
                    }
                    document.querySelector(script.$$header?.target).innerHTML = text;
                    if(text.includes('<script')) {
                        let re = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/g
                        let scripts = re.exec(text)
                        let scripttag = document.createElement('script');
                        scripttag.textContent = scripts[1];
                        document.body.appendChild(scripttag);
                    }
                }
                nolang.initForms();
            })
        }).catch(error=>{
            console.error(error)
        });
    },
    runString(str){

    },
    serializeForm (form) {
        let serialized = {};
        let inputs = form.querySelectorAll('input, select');
        for (let {name, value, attributes} of inputs) {
            if(["integer", "number"].includes(attributes.sstype?.value)) {
                value = parseInt(value);
            } else if(attributes.sstype?.value === 'boolean') {
                value = Boolean.parseBoolean(value)
            } else if(attributes.sstype?.value === 'jdate') {
                value = moment.from(value, 'fa', 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD');
            }
            serialized[name] = value;
        }
        return serialized;
    },
    getMessage : null,
    /*getMessage(validity, field) {

        if (validity.valueMissing) return `ورود این مقدار اجباری می باشد`;
        if (validity.typeMismatch) {
            if(field.type==='email'){
                return 'لطفا یک ایمیل واقعی وارد نمایید'
            }
            return 'لطفا مقدار صحیح وارد نمایید'
        };
        if (validity.tooLong) return `طول مقدار باید کوچکتر از ${field.maxLength} باشد`;
        if (validity.tooShort) return `طول مقدار باید برابر با ${field.maxLength} باشد`;
        if (validity.patternMismatch) {
            if(field.pattern==='[a-zA-Z ]*'){
                return 'لطفا مقدار را با حروف انگلیسی وارد نمایید'
            } else if(field.pattern==='[ ا-ی]*'){
                return 'لطفا مقدار را با حروف فارسی وارد نمایید'
            }
            return 'لطفا مقدار صحیح وارد نمایید'
        };


        /!**
         *
         *     badInput
         *     customError
         *     patternMismatch
         *     rangeOverflow
         *     rangeUnderflow
         *     stepMismatch
         *     tooLong
         *     tooShort
         *     typeMismatch
         *     valueMissing
         *!/

        return '';
    }*/
    submitForm(formdata, schema, action) {
        let command = {
            $$schema: schema,
            $$header: {
                action: action,
                debug: true
            }
        }
        Object.assign(command, formdata);
        console.log(command)
        this.runScript(command);
    },
    initForms() {
        let forms = document.querySelectorAll('form');
        let thes = this;
        for(let form of forms) {
            //validity
            if(this.getMessage) {
                const fields = Array.from(form.elements);
                fields.forEach((field) => {
                    field.addEventListener("invalid", () => {
                        const validity = field.validity;
                        if (validity.valid) return;
                        const message = thes.getMessage(validity, field);
                        field.setCustomValidity(message);
                    });

                    field.addEventListener("input", () => {
                        field.reportValidity();
                    });
                });
            }
            //submit
            let button = form.querySelector('button');
            let schema = button.dataset.schema;
            let action = button.dataset.action;
            let submitmessage = button.dataset.submitMessage;
            button.addEventListener('click',(event)=>{
                event.preventDefault();
                let serialized = this.serializeForm(form);
                if (form.reportValidity() && confirm(submitmessage)){
                    this.submitForm(serialized, schema, action);
                }
                return false;
            }, false);
        }
    },
    initJalaliDatePickers() {
        // $('input[sstype="jdate"]').attr('data-jdp','');
        jalaliDatepicker.startWatch();
    },
    /*getMessage(validity, field) {

        if (validity.valueMissing) return `ورود این مقدار اجباری می باشد`;
        if (validity.typeMismatch) {
            if(field.type==='email'){
                return 'لطفا یک ایمیل واقعی وارد نمایید'
            }
            return 'لطفا مقدار صحیح وارد نمایید'
        };
        if (validity.tooLong) return `طول مقدار باید کوچکتر از ${field.maxLength} باشد`;
        if (validity.tooShort) return `طول مقدار باید برابر با ${field.maxLength} باشد`;
        if (validity.patternMismatch) {
            if(field.pattern==='[a-zA-Z]*'){
                return 'لطفا مقدار را با حروف انگلیسی وارد نمایید'
            } else if(field.pattern==='[ا-ی]*'){
                return 'لطفا مقدار را با حروف فارسی وارد نمایید'
            }
            return 'لطفا مقدار صحیح وارد نمایید'
        };


        /!**
         *
         *     badInput
         *     customError
         *     patternMismatch
         *     rangeOverflow
         *     rangeUnderflow
         *     stepMismatch
         *     tooLong
         *     tooShort
         *     typeMismatch
         *     valueMissing
         *!/

        return '';
    },
    serializeForm: function (form) {
        let serialized = {};
        let inputs = form.querySelectorAll('input, select');
        for (let {name, value, attributes} of inputs) {
            if(["integer", "number"].includes(attributes.sstype?.value)) {
                value = parseInt(value);
            } else if(attributes.sstype?.value === 'boolean') {
                value = Boolean.parseBoolean(value)
            } else if(attributes.sstype?.value === 'jdate') {
                value = moment.from(value, 'fa', 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD');
            }
            serialized[name] = value;
        }
        return serialized;
    },
    initForms() {
        let forms = document.querySelectorAll('form')
        for(let form of forms) {
            //validity
            const fields = Array.from(form.elements);
            fields.forEach((field) => {
                field.addEventListener("invalid", () => {
                    const validity = field.validity;
                    if(validity.valid) return;
                    const message = pfapp.getMessage(validity, field);
                    field.setCustomValidity(message);
                });

                field.addEventListener("input", () => {
                    field.reportValidity();
                });
            });
            //submit
            let button = form.querySelector('button');
            let schema = button.dataset.schema;
            let action = button.dataset.action;
            let submitmessage = button.dataset.submitMessage;
            button.addEventListener('click',(event)=>{
                event.preventDefault();
                let serialized = this.serializeForm(form);
                if (form.reportValidity() && confirm(submitmessage)){
                    pfapp.submitForm(serialized, schema, action);
                }
                return false;
            }, false);
        }
    },*/
    go2page(schema, view, pagesize, page, target, counterid, length) {
        if(!this.pages)
            this.pages = {};
        let maxpage = Math.floor(length/pagesize || 10);
        if(page === 'NEXT') {
            page = (this.pages[schema] || 0) + 1;
        } else if(page === 'PREV') {
            page = (this.pages[schema] || maxpage) - 1;
        }
        if(page<0) page = 0
        if(page > maxpage) page = 1;
        this.pages[schema] = page;
        let script = {
            $$schema: schema,
            $$header: {
                action: 'R',
                limit: pagesize,
                skip: page * pagesize,
                page: page,
                view: view,
                target: target
            }
        }
        this.runScript(script, page);
        // document.querySelector('#'+counterid).innerHTML = page+'/'+length
    }
    /*gridit(gridselector, schema) {
        console.log('-------------------------------------', schema)
        new gridjs.Grid({
            columns: [
                {
                    id: 'firstNameFa',
                    name: 'نام'
                }, {
                    id: 'lastNameFa',
                    name: 'نام خانوادگی'
                }, {
                    id: 'emailAddress',
                    name: 'ایمیل'
                },
            ],
            pagination: {
                limit: 10,
                server: {
                    url: (prev, page, limit) => `${prev}/${page * limit}/${limit}`
                }
            },
            search: true,
            sort: true,
            server: {
                url: '/grid/'+schema,
                then: data=>data,
                total: data => 38434
            },
            className: {
                td: 'pf-grid-td small',
                footer: 'pf-grid-footer',
                th: 'small'
            }
                /!*data: () => {
                    return pfapp.runScript({
                        $$schema: 'merchants',
                        $$header: ''
                    })
                }*!/
        }).render(document.querySelector(gridselector));
    }*/
}
