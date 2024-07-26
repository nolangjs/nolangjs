const nolang = {
    init() {
        this.initForms();
        this.initJalaliDatePickers();
        this.filters = {};
        this.sorts = {};
        this.pagesize = 12;
        this.history = [];
        this.menus = [];
    },
    runScript(script, callback, formData) {
        // script.$$header.debug = true;
        /*if(localStorage.jwt) {
            script.$$header.user = {
                token: localStorage.jwt
            }
        }*/

        if(typeof script === 'string') {
            try {
                let obj = JSON.parse(script)
                script = obj;
            } catch (e) {
                try {
                    eval(script);
                } catch (ee) {

                }
            }
        }

        let init1 = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: typeof script === 'string' ? script : JSON.stringify(script),
        };
        if(formData) {
            formData.append('command', typeof script === 'string' ? script : JSON.stringify(script))
            init1 = {
                method: "POST",
                /*headers: {
                    'Content-Type': 'multipart/form-data'
                },*/
                // credentials: 'same-origin',
                // mode:        'same-origin',
                /*headers: {
                    "Content-Type": "application/",
                },*/
                body: formData,
            };
        }
        fetch("/data", init1).then(response => {
            response.text().then(text=>{
                if(script.$$header?.filter) {
                    nolang.filters[script.$$schema] = script.$$header.filter;
                }
                if(script.$$header?.sort) {
                    nolang.sorts[script.$$schema] = script.$$header.sort;
                }
                if(script.$$header?.debug) {
                    console.log(script, text)
                }
                if(script.$$header?.target) {
                    if(text.includes('$$target')) {
                        text = text.replaceAll('$$target', script.$$header?.target);
                        text = text.replaceAll('$$page', script.$$header?.page +1);
                    }
                    let target = document.querySelector(script.$$header?.target);
                    if(!target) target = document.querySelector('#main');
                    target.innerHTML = text;
                    //add to history
                    nolang.history.push([target, text]);
                    if(text.includes('<script')) {
                        let re = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/g
                        let scripts = re.exec(text)
                        let scripttag = document.createElement('script');
                        scripttag.textContent = scripts[1];
                        document.body.appendChild(scripttag);
                    }
                    nolang.initForms();
                }
                /*if(script.$$header?.user?.username) {
                    let token = JSON.parse(text).token;
                    if(token) {
                        let form = document.querySelectorAll('form')[0];
                        let address = form.getAttribute('action');
                        localStorage.jwt = token;
                        form.submit()
                    }
                }*/

                if(callback) {
                    callback(text);
                }
                return text;
            });
        }).catch(error=>{
            console.error(error)
        });
    },
    runString(str) {

    },

    serializeForm (form, action) {
        let serialized = {};
        let formData = null;
        let items = 0;
        let inputs = form.querySelectorAll('input, select, textarea');
        for (let {name, value, attributes, files} of inputs) {
            if (attributes.class?.value.startsWith('cropit')) {
                continue
            }
            if(attributes.type.value === 'file') {
                if(formData == null) formData = new FormData();
                formData.append(attributes.name.value, files[0]);
                continue;
            }
            if(value) {
                if (["integer", "number"].includes(attributes.sstype?.value)) {
                    value = parseInt(value);
                } else if (attributes.sstype?.value === 'boolean') {
                    value = Boolean.parseBoolean(value)
                } else if (attributes.sstype?.value === 'jdate') {
                    // console.log('before', value)
                    value = moment.from(value, 'fa', 'YYYY/MM/DD').format('YYYY-MM-DD');
                    // console.log('jjjj', value)
                }
            }
            if(/*value.indexOf('"') > -1 || */typeof value === 'string' && value.indexOf("'") > -1) {
                alert('از کاراکتر کوتیشن در فیلدها استفاده نکنید!');
                return false;
            }
            if(action === 'S') {
                if (value === null || value === '' || value === 'Invalid date' || value === NaN) {
                    continue;
                }
                if(attributes.sstype?.value === 'string') {
                    value = {
                        '$like': '%'+value+'%'
                    }
                }
            }
            if (["integer", "number", "date", "jdate", "boolean"].includes(attributes.sstype?.value) && value === '') {
                value = null;
            }
            serialized[name] = value;
            if(attributes.type?.value !== 'hidden') {
                items++;
            }
        }
        if (action === 'S' && items === 0) {
            alert('لطفا جهت جستجو مقادیری را مشخص کنید!');
            return false;
        }
        console.log(serialized)
        return {serialized, formData};
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
            } else if(field.pattern==='[ آ-ی]*'){
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
    submitForm(_serialized, schema, action, id, id_value, target, view, method, callback) {
        let serialized = _serialized.serialized;
        let formData = _serialized.formData;
        let command = {
            $$schema: schema,
            $$header: {
                action: action,
                target: target,
                method: method,
                view: view,
                debug: true
            }
        };
        if(action === 'S') {
            command.$$header.filter = serialized;
            command.$$header.action = 'R';
            command.$$header.limit = nolang.pagesize;
        } else if(action === 'M') {
            command.$$header.params = serialized;
        } else {
            Object.assign(command, serialized);
        }
        if(['U','D'].indexOf(action) > -1) {
            try {
                id_value = parseInt(id_value)
            } catch (e){
                //todo
            }

            if(!command.$$header.hasOwnProperty('filter')) {
                command.$$header.filter = {
                    [id]: id_value
                };
            } else {
                Object.assign(command.$$header.filter, {
                    [id]: id_value
                })
            }

            delete command[id];
        }
        console.log(command);
        this.runScript(command, callback, formData);
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
            let buttons = form.querySelectorAll('button.submit');//todo change button to .button
            let response = form.querySelector('.response');

            if(buttons) {
                buttons.forEach(button=>{
                    let schema = button.dataset.schema;
                    let action = button.dataset.action;
                    let target = button.dataset.target;
                    let method = button.dataset.method;
                    let view = button.dataset.view;
                    let id = button.dataset.id;
                    let id_value = button.dataset.idValue;
                    let submitmessage = button.dataset.submitMessage;
                    if(!button.hasAttribute('onclick') || button.onclick !== 'undefined') {
                        let onclick = (event) => {
                            event.preventDefault();
                            let serialized = this.serializeForm(form, action);
                            if (serialized && form.reportValidity() && confirm(submitmessage)) {
                                let callback = (result) => {
                                    button.classList.add('bi-check2')
                                    button.classList.remove('bi-clock-history');
                                    button.removeAttribute('disabled');
                                    button.classList.remove('bg-secondary');
                                    setTimeout(() => {
                                        button.classList.remove('bi')
                                        button.classList.remove('bi-check2');
                                    }, 1000);

                                    try {
                                        let result = JSON.parse(result);
                                        if (result.success === false) {
                                            response.innerHTML = result.message;
                                        }
                                    } catch (e) {

                                    }

                                }
                                button.classList.add('bi')
                                button.classList.add('bi-clock-history');
                                button.classList.add('bg-secondary');
                                button.setAttribute('disabled', 'true');

                                this.submitForm(serialized, schema, action, id, id_value, target, view, method, callback);
                            }
                        };
                        button.addEventListener('click', onclick, false);
                    }
                })
            }

            //login
            let login_button = form.querySelector('button.login');//todo change button to .button
            // let action = button.dataset.action;
            // let id = button.dataset.id;
            // let id_value = button.dataset.idValue;
            if(login_button) {
                login_button.addEventListener('click', this.login);
            }
        }
    },
    initJalaliDatePickers() {
        // $('input[sstype="jdate"]').attr('data-jdp','');
        if(typeof jalaliDatepicker !== 'undefined')
            jalaliDatepicker.startWatch();
    },
    activeMenu(item, menu) {
        let elements = document.querySelectorAll(menu);
        for(let el of elements) {
            el.classList.remove('active');
        }
        item.classList.add('active');
        nolang.menus.push()
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
            } else if(field.pattern==='[آ-ی]*'){
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
        if(nolang.filters[schema]){
            script.$$header.filter = nolang.filters[schema];
        }
        if(nolang.sorts[schema]){
            script.$$header.sort = nolang.sorts[schema];
        }
        this.runScript(script);
        // document.querySelector('#'+counterid).innerHTML = page+'/'+length
    },
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
    goBack() {
        let l = nolang.history.length;
        if (l>=2) {
            l = l - 2
        } else
            return;
        nolang.history[l][0].innerHTML = nolang.history[l][1];
        nolang.history.pop();
    }
}
