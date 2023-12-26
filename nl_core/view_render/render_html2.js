let ST = require('./st');
let ss_obj = 'dl';
const logger = global.logger;

// $$VM = {};

function render_object(obj) {

    function render_style(jstyle){
        let style = '';
        for(let item in jstyle) {
            style += ` ${item}:${jstyle[item]};`
        }
        return style;
    }

    // let obj = {...domObject};

    let props = '';

    for (let key in obj) {
        // key = key.toLowerCase();
        if(key.startsWith('$')){

        } else if(key === 'style') {
           props += ` style="${render_style(obj[key])}"`;
        } else {
            props += ` ${key}="${obj[key]}"`
            // console.log(key, obj[key], ` ${key}="${obj[key]}"`)
        }
    }

    let tag = obj.$tag || 'div';
    let text = obj.$text;
    let html = '';
    if(obj.$html){
        if(typeof obj.$html !== 'string') {
            if(!obj.$html[Symbol.iterator]){
                //throw "dfafasf"
            } else {
                for(let child of obj.$html) {
                    if(child)
                        html += render_object(child)
                }
            }
        } else {
            html += obj.$html
        }
    }
    return `<${tag}${props}>${text || html || ''}</${tag}>`;
}

let ss_array_container = 'div';

function setCells(parentCell, vi, tempCells) {
    if (vi === 'class') {
        if (!parentCell[vi])
            parentCell[vi] = tempCells[vi];
        else
            parentCell[vi] += " " + tempCells[vi];
    } else {
        parentCell[vi] = tempCells[vi];
    }
}

function getView(itsSchema, header, parentView) {
    let view;
    if (!itsSchema.$$views || itsSchema.$$views.length === 0) {
        //throw new Exception("no view exists in " + itsSchema.$id);
        logger.trace("no view exists in " + itsSchema.$id);
        if (!itsSchema.$id) {
            logger.trace(itsSchema)
        }
        return null;
    } else {
        if (header && header.view) {
            view = itsSchema.$$views.find( (v) => {
                return (( (v.viewId === header.view) /*|| (v.view && v.view.indexOf(header.view) > -1)*/  ) && !v.disable)            });
            if (view == null) {
                // throw new Exception("no view exists by view " + header.view + " in " + itsSchema.$id);
                logger.trace("no view exists by view " + header.view + " in " + itsSchema.$id);
                //return null;
            }
        } else if (parentView && parentView.viewId) {
            view = itsSchema.$$views.find( (v) => {
                return ((v.viewId === parentView.viewId /*|| (v.view && v.view.indexOf(parentView.view) > -1)*/ ) && !v.disable)             });
            /*if (view == null) {
                // throw new Exception("no view exists by view " + header.view + " in " + itsSchema.$id);
                console.log("no view exists by view " + parentView.viewId + " in " + itsSchema.$id);
                return null;
            }*/
        }
        if (view == null) {
            view = itsSchema.$$views.find( (v) => v.default);
            if (view == null) {
                view = itsSchema.$$views[0];
            }
        }
    }
    return view;
}

async function getBox(propData, propSchema, pview, key, parentView, parentKey, schema, nl_engine, env) {
    // console.log('getBox for '+key+'/'+parentKey+'/'+propData)
    let newBox = {
        $tag: "input",
        // id: key,
        name: key,
        ssid: parentKey + "." + key,
        sstype: propSchema.type,
        value: propData,
        placeholder: propSchema.title || key,
        class: "ss_" + key
    };

    if (!propData) {
        if (propSchema.default)
            newBox.value = propSchema.default;
        else
            delete newBox.value;
    }

    // let typeahead = false;

    if (/*propData && */(propSchema.$$rel)) {
        // typeahead = true;
        const rel = propSchema.$$rel;
        //post packet to server and replace response in destination_id
        const relCommand = {
            "$$header": {
                "action": "R",
                "sort": rel.return,
                "cache": rel.cache
            },
            "$$schema": rel.schema
        };

        /*newPacket.$$header.filter = {
         "$$objid": propData
         };*/

        newBox.$tag = 'select';
        newBox.$html = [];


        if (rel.view) {
            relCommand.$$header.view = rel.view;
        }

        // if (!$$VM.lookups)
        //     $$VM.lookups = {};

        // if (!$$VM.lookups[key]) { //TODO set in sessionStorage
        let values = await nl_engine.runPacket(relCommand, propSchema, env)
        // $$VM.postPacket(newPacket, function (postedpacket) {
        if (!values) {
            logger.error('$$rel for ' + key + ' , no data returned!');
        } else {
            newBox.$html.push({
                $tag: "option",
                value: "",
                $html: "انتخاب کنید"
            })
            for (let val of values) {
                let option = {
                    $tag: "option",
                    value: val[rel.key || '$$objid'],
                    $text: val[rel.return || rel.key || '$$objid']
                };
                if(rel.extravals) {
                    for(let exval of rel.extravals){

                        option[exval] = val[exval]+'';
                    }
                }
                newBox.$html.push(option);
            }
            // const source = postedpacket;
            // console.log(postedpacket)
            // $$VM.lookups[key] = source;
            /*$('[ssid="' + parentKey + "." + key + '"]').typeahead({
                source: source,
                autoSelect: true,
                displayText: function (item) {
                    if (rel.displayText) {
                        if (rel.displayText.indexOf("{{") > -1)
                            return ST.select(item).transformWith(rel.displayText).root();
                        else
                            return item[rel.displayText];
                    } else
                        return Object.values(item)[0];
                },
                afterSelect: function (item) {
                    // this.$element[0].value = item.nome;
                    let _value = "";
                    if (rel.return) {
                        if (rel.return.indexOf("{{") > -1)
                            _value = ST.select(item).transformWith(rel.return).root();
                        else
                            _value = item[rel.return];
                    } else {
                        _value = Object.values(item)[0];
                    }
                    changeLocalData(parentKey + "." + key, propSchema, _value);
                },
                showHintOnFocus: true
            });*/
            // console.log($$VM.lookups)
            console.log('lookups for ' + key + ' added')
        }

        // }

        // newBox.class += " typeahead";
        // newBox.autocomplete = "off";//why not?
        // newBox["data-provide"] = "typeahead";
    }

    if (propSchema.disabled) {
        if (propSchema.disabled === true)
            newBox.disabled = true;
        else {
            console.log(propSchema.disabled)
        }
    }

    if (propSchema.type === 'number') {
        newBox.type = "number";
        newBox.autocomplete = "off";
    }

    if (propSchema.minValue) {
        newBox['min'] = propSchema.minValue;
    }

    if (propSchema.maxValue) {
        newBox.max = propSchema.maxValue;
    }

    if (propSchema.minLength) {
        newBox['minlength'] = propSchema.minLength;
    }

    if (propSchema.maxLength) {
        newBox.maxlength = propSchema.maxLength;
    }

    if (propSchema.pattern) {
        // if(propSchema.pattern==='email') {
        //     newBox.type = 'email'
        // } else {
        newBox.pattern = propSchema.pattern;
        // }
    }

    let required = parentView?.required || schema.required;
    if (required && required.indexOf(key) > -1) {
        newBox.required = "required";
        newBox.placeholder = 'الزامی'
    }

    let isImage = false;

    if (propSchema.type === 'image') {
        isImage = true;
        newBox.$tag = "div";
        newBox.class = "image-cropper";
        newBox._imgdata = propData;
        newBox.$html = [
            {
                "$tag": "div",
                "class": "cropit-preview"
            },
            {
                "$tag": "input",
                "type": "range",
                "class": "cropit-image-zoom-input"
            },
            {
                "$tag": "input",
                "type": "file",
                "class": "cropit-image-input"
            },
            {
                "$tag": "div",
                "class": "select-image-btn",
                "$html": "Select New Image"
            }
        ];
        //newBox.autocomplete = "off";

    }

    if (propSchema.type === 'jdate' || propSchema.type === 'date') {
        newBox.autocomplete = "off";
    }

    /**
     * https://github.com/majidh1/JalaliDatePicker
     * ATTR On Input:
     *
     * data-jdp
     *
     * data-jdp-min-date
     *
     * data-jdp-max-date
     *
     * data-jdp-only-date
     *
     * data-jdp-only-time
     */
    if (propSchema.type === 'jdate') {
        newBox['data-jdp'] = '';
        if (propSchema.min)
            newBox['data-jdp-min-date'] = propSchema.min;
        if (propSchema.max)
            newBox['data-jdp-min-date'] = propSchema.max;
        // var pd = $('#flightdate').persianDatepicker().hide();
    }

    if (propSchema.type === 'boolean') {
        newBox.type = "checkbox";
        newBox.value = "true";
        if (propData)
            newBox.checked = "checked"
    }

    if (propSchema.type === 'text') {
        newBox.$tag = "textarea";
        newBox.text = propData;
    }

    if (propSchema.required) {
        newBox.required = true;
    }

    if (propSchema.$$enum || propSchema.enum) {
        newBox.$tag = "select";
        newBox.$html = [];
        let len = propSchema.$$enum?.length || propSchema.enum?.length;
        newBox.$html.push({
            $tag: "option",
            value: "",
            $html: "انتخاب کنید"
        })
        for (let i = 0; i < len; i++) {
            newBox.$html.push({
                $tag: "option",
                value: propSchema.enum ? propSchema.enum[i] : i,
                $html: propSchema.$$enum ? propSchema.$$enum[i] : propSchema.enum[i]
            })
        }
    }

    if (pview && pview.template && pview.template.inputTemplate) {
        let tempCells = pview.template.inputTemplate;

        tempCells = ST.select({schema: propSchema, data: propData}).transformWith(tempCells).root();

        for (let vi in tempCells) {
            // arrCell[vi] = tempCells[vi];
            setCells(newBox, vi, tempCells);
        }
    }

    /*if (!typeahead) {
        newBox.onchange = `_onchange('${parentKey}', '${key}', ${isImage}, 'propSchema')`;
    }*/

    if (propSchema.type === 'map') {
        // newBox.$tag = "hidden";
        const z = {
            $tag: "div",
            $html: [
                newBox,
                {
                    "$tag": "input",
                    "class": "gLocation",
                    "forssid": parentKey + "." + key,
                    "id": "locationNameInput",
                    "type": "text"
                },
                {
                    "$tag": "div",
                    "class": "gmap",
                    "sstype": "gmap",
                    "ssid": parentKey + "." + key
                }
            ]
        };
        newBox = z;
    }

    if (propSchema.debug) {
        console.log('end of getBox for ' + key + '/' + parentKey + '/' + propData)
    }


    return newBox;
}

function makeReady(tempCells, schema, packet, parentCell) {
    tempCells = ST.select({schema: schema, data: packet}).transformWith(tempCells).root();

    for (let vi in tempCells) {
        parentCell[vi] = tempCells[vi];
    }
    return tempCells;
}

async function pushGrid(schema, data, destination_id, view, key1, parentKey1, nl_engine, env) {
    // console.log(schema, view, key1, parentKey1, nl_engine, env)
    let length = await nl_engine.dataPacket({
        $$schema: schema.$id,
        $$header: {
            action: 'L',
        }
    }, schema, env);
    // console.log('LENGTH', length[0].count)
    length = length[0].count;
    let pages = Math.floor(length/view?.pagesize || 10)+1;
    let fields = [];
    let ths = [];
    for(let f in schema.properties) {
        let field = schema.properties[f];
        if(view?.visibleFields) {
            if(view?.visibleFields.indexOf(f)<0) continue;
        }
        ths.push({
            $tag: 'th',
            $text: field.title || f
        })
        fields.push(f)
    }
    let rows = [
        {
            $tag: 'thead',
            $html: [
                {
                    $tag: 'tr',
                    $html: ths
                }
            ]
        }
    ];
    for(let obj of data) {

        let tds = [];
        for(let f of fields) {
            tds.push({
                $tag: 'td',
                $text: obj[f] || ''
            })
        }
        let tr = {
            $tag: 'tr',
            $html: tds
        };
        if(view.click) {
            let click = ST.select({schema: schema, data: obj, env: env}).transformWith(view.click).root();
            console.log('ssssssssssssss', obj, view.click)
            tr.onclick = "nolang.runScript(JSON.parse(atob('"+Buffer.from(JSON.stringify(click)).toString('base64')+"')), '')"
        }
        rows.push(tr)
    }
    let footer = null;
    let id = 'selector' + Math.floor(Math.random() * 10000000);
    footer = {
            $tag: 'footer',
            class: 'text-center',
            $html: [
                {
                    $tag: 'button',
                    $text: 'صفحه قبل',
                    onclick: `nolang.go2page('${schema.$id}', '${view.viewId}', '${view.pagesize}', 'PREV', '$$target', '${id}', ${length})`
                },
                {
                    $tag: 'span',
                    id: id,
                    $text: '$$page/'+pages
                },
                {
                    $tag: 'button',
                    $text: 'صفحه بعد',
                    onclick: `nolang.go2page('${schema.$id}', '${view.viewId}', '${view.pagesize}', 'NEXT', '$$target', '${id}', ${length})`
                }
            ]
        }
    return {
        $tag: 'div',
        class: view.template?.listContainerTemplate?.class,
        $html: [
            {
                $tag: 'header',
                $text: view.title || schema.title || ''
            },
            {
                $tag: 'table',
                class: view.template?.class,
                $html: rows
            },
            footer
        ]
    }
}

async function pushObject(schema, packet, destination_id, view, key1, parentKey1, nl_engine, env) {

    // const deepEach = require('deepeach');

    /*deepEach(schema, function (k, obj) {
     var v = obj[k];
     if(k.endsWith("=") && k != "==") {
     if(typeof v === "string") { //rule name
     //use ruleId
     var rule = view.$$rules.find(r => r.ruleId === action.visible);
     } else if (typeof v === "object") { //the rule itself
     var ruleDef = v.ruleDef;
     var ruleData = v.ruleData;
     var result = jsonLogic.apply(ruleDef, ruleData);
     delete obj[k];
     obj[k.replace('=','')] = result;
     }
     }
     });

     console.log(schema)*/


    /*if (destination_id) {
        $$VM.destination_id = destination_id;
    }*/

    if (packet) {

        if (Array.isArray(packet)) {

            if(view?.grid) return pushGrid(schema, packet, destination_id, view, key1, parentKey1, nl_engine, env);

            let parentCell = {$tag: ss_array_container, $html: [] /*, id: destination_id*/};
            /*if(schema.title)
             parentCell.$html.push({
             "$text": schema.title,
             "$tag": "header"
             });

             if(packet.length == 0){
             parentCell.$html.push({
             "$text": "empty list",
             "$tag": "footer"
             });
             }*/

            if (view?.selectable) {
                parentCell.selectable = view.selectable;
            }

            if (view?.template) {
                let tempCells = view.template;

                if (tempCells.listContainerTemplate) {
                    tempCells = makeReady(tempCells.listContainerTemplate, schema, packet, parentCell);

                }

                if (view.template.absolute) {
                    return parentCell;
                }
            }

            let pi = 0;
            for (const eachData of packet) {
                // var destination_id_x = "container_index_" + "_" + Math.random().toString(36).substring(7);
                const key2 = schema.$id + '[' + pi + ']';
                pi++;
                const newObject = await pushObject(schema, eachData, null, view, key2, parentKey1, nl_engine, env);
                // newObject.class += " ss_" + schema.$id;

                parentCell.$html.push(newObject);
            }

            if (view?.template?.listFooterTemplate) {
                parentCell.$html.push(view.template.listFooterTemplate);

                // setActions(view.template.listFooterTemplate, view.template.listFooterTemplate, packet, null, null, parentCell)
            }

            return parentCell;
        }

    }
    //render main object


    const props = schema.properties;
    let parenttag = 'div';
    if (view?.itemContainer)
        parenttag = "div";
    if (view?.editable)
        parenttag = "form";
    if (view?.grid)
        parenttag = "tr";

    const schemaId = schema.$id;

    //auto update:
    if (view?.autoUpdate) {
        $$VM.autoUpdates.push(schemaId);
    }


    const ssSchemaId = 'ss_' + (schema.$id || key1);
    let _class = null;//= ssSchemaId;
    if (view?.itemContainer)
        _class = _class + " ssItemContainerParent";
    if (destination_id && $('#' + destination_id).length)
        _class += ' ' + $('#' + destination_id).attr('class');
    let parentCell = {$tag: parenttag, $html: []};
    if (_class)
        parentCell.class = _class

    if (destination_id)
        parentCell.id = destination_id;
    //set view template of current object
    if (view?.template) {
        var tempCells = view.template;

        if (tempCells.objectTemplate) {
            tempCells = tempCells.objectTemplate;
        }

        tempCells = ST.select({schema: schema, data: packet, env: env}).transformWith(tempCells).root();

        for (var vi in tempCells) {
            setCells(parentCell, vi, tempCells);
        }

        if (view.template.absolute) {
            return parentCell;
        }
    }

    //header of
    if ((view.title||schema.title) && !view.hideTitles) {
        parentCell.$html.push(
            {
                "$tag": "header",
                "$text": view.title || schema.title,
                "class": "sstitle"
            }
        );
    }

    //render child properties:
    for (let key in props) {
        const propSchema = props[key];
        const propData = packet ? packet[key] : null;

        if (view?.visibleFields) {
            if (view.visibleFields.indexOf(key) < 0) {
                continue;
            }
        }

        if (view?.hiddenFields) {
            if (view.hiddenFields.indexOf(key) > -1) {
                continue;
            }
        }

        //if hidden
        if (propSchema.$$hidden) {
            continue;
        }

        if (view?.hideEmpties && !propData) {
            if (view.hideEmpties === true || view.hideEmpties.indexOf(key) > -1)
                continue;
        }


        if (!key1) {
            key1 = propSchema.$id;
        }
        if (!key1) {
            key1 = schema.$id;
        }
        await pushOne(propSchema, propData, parentCell, packet, key, view, key1, schema, null, nl_engine, env);
    }

    //actions:
    // setActions(view, schema, packet, ssSchemaId, key1, parentCell);

    if(view?.template?.footerTemplate){
        let footer = makeReady(view.template.footerTemplate, schema, packet, {});
        parentCell.$html.push(footer);
    } else if (view?.editable) {
        parentCell.$html.push({
            $tag: 'footer',
            $html:[{
                $tag: 'button',
                $text: view?.submitTitle || 'Submit',
                'data-action': view?.submitAction || 'C',
                'data-submit-message': view?.submitMessage || 'آیا از ارسال اطمینان دارید؟',
                'data-schema': schemaId
            }]
        });
    }

    return parentCell;
}

async function pushOne(propSchema, propData, parentCell, packet, key, parentView, parentKey, schema, postedpacket, nl_engine, env) {
    //debug
    if (propSchema.debug) {
        console.debug(propData);
    }

    const editable = (parentView && parentView.editable && (parentView.editable == true || parentView.editable.indexOf(key) > -1)) || (packet && packet.$$header && packet.$$header.action == 'W');

    if (propData && propSchema.$$rel && editable /*propSchema.type == "userid" || propSchema.type == "objectid"*/) {
        let destination_id = "container_" + key + "_" + Math.random().toString(36).substring(7) + "_inner";

        var pview = getView(propSchema, packet ? packet.$$header : null, parentView);

        //if hidden in view
        if (pview && pview.hidden)
            return;

        if (pview && pview.template.id) {
            destination_id = pview.template.id;
        }

        var innerCell = {
            $tag: ss_obj,
            class: "ss_" + key,
            $html: [
                {
                    "$tag": "header",
                    $html: propSchema.title
                },
                {
                    "$tag": ss_obj,
                    // id: destination_id,
                }
            ]
        };

        if (pview && pview.template) {
            var tempCells = pview.template;

            if (tempCells.objectTemplate) {
                tempCells = tempCells.objectTemplate;
            }

            tempCells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(tempCells).root();

            for (var vi in tempCells) {
                //if(vi !== 'id')
                // innerCell[vi] = tempCells[vi];
                setCells(innerCell, vi, tempCells);
            }

            if (pview.template.absolute) {
                return parentCell;
            }
        }

        if (propData && (propSchema.$$rel)) {
            const rel = propSchema.$$rel;
            //post packet to server and replace response in destination_id
            const newPacket = {
                "$$header": {
                    "action": "R",
                    "cache": {
                        "key": propData,
                        "time": 3600
                    }
                },
                "$$schema": rel.schema
            };

            const kk = rel.key || schema.$$storage?.id || "SSobjid";

            newPacket.$$header.filter = {
                [kk]: propData
            };


            if (rel.view) {
                newPacket.$$header.view = rel.view;
            }

            $$VM.postPacket(newPacket, function (postedpacket) {
                $$VM.renderView(postedpacket, destination_id)
            });

        } else {
            innerCell = await pushObject(propSchema, propData, destination_id, pview, key, parentKey, nl_engine, env)
        }


        parentCell.$html.push(innerCell);
    }
    else if (propSchema.type === "object") {
        let object_id = "container_" + key + "_" + Math.random().toString(36).substring(7);

        if (typeof propData == 'string')
            propData = JSON.parse(propData);


        let pview = getView(propSchema, packet ? packet.$$header : null, parentView);


        //if hidden in view
        if (pview && pview.hidden)
            return;


        //setting id of DOM
        if (pview && pview.template.id) {
            // newObject.id = pview.template.id;
            object_id = pview.template.id;
        }

        let innerCell = {
            $tag: ss_obj,
            class: "ss_" + key,
            $html: [{
                // "id": object_id
            }]
        };


        if (pview && pview.template) {
            let tempCells = pview.template;

            if (tempCells.objectTemplate) {
                tempCells = tempCells.objectTemplate;
            }

            tempCells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(tempCells).root();

            for (let vi in tempCells) {
                //if(vi !== 'id')
                // innerCell[vi] = tempCells[vi];
                setCells(innerCell, vi, tempCells);
            }

            /*if (pview.template.absolute) {
                return parentCell;
            }*/
        } else if (parentView && parentView.template && parentView.template.itemsTemplate) {
            var tempCells = parentView.template.itemsTemplate;

            if (tempCells.objectTemplate) {
                tempCells = tempCells.objectTemplate;
            }

            tempCells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(tempCells).root();

            for (var vi in tempCells) {
                //if(vi !== 'id')
                //innerCell[vi] = tempCells[vi];
                setCells(innerCell, vi, tempCells);
            }
        }

        if (propData && (propData.$$header || propData.$$import)) {
            let schemaid;
            if (propData.$$header) {
                schemaid = propData.$$schema;
                let _schema = nl_engine.ajv.getSchema(schemaid).schema;
                /*deepEach(_schema, function (k, obj) {
                    let v = obj[k];
                    if (k === '$ref' && v.startsWith('#')) {

                        console.log('--------------- ',k, v)
                        Object.assign(obj, _.get(_schema, v.replace('#/','').replace('/','.')))
                        delete obj[k];
                    }
                });*/
                let _packet = await nl_engine.dataPacket(propData, _schema, env)
                let pview = getView(_schema, propData.$$header , parentView);
                let innerCell1 = await pushObject(_schema, _packet, null, pview, null, null, nl_engine, env);
                innerCell.$html=[innerCell1];
                if(propData.$$header.target) {
                    //todo very bad
                    innerCell = JSON.parse(JSON.stringify(innerCell).replace(/\$\$target/g, propData.$$header?.target));
                    innerCell = JSON.parse(JSON.stringify(innerCell).replace(/\$\$page/g, propData.$$header?.page || 1));
                }
            } else {
                schemaid = propData.$$import
                let postedpacket = nl_engine.ajv.getSchema(schemaid).schema;
                innerCell = await pushObject(propSchema, postedpacket, null, pview, null, null, nl_engine, env);
            }
            //post packet to server and replace response in object_id

            // if (postedpacket.data && postedpacket.schema && !(postedpacket.data.success == false)) $$VM.renderView(postedpacket, object_id)

            // console.log('import '+ object_id)
            // $$VM.send(propData);

        }
        /*else if (pview && pview.engine && pview.engine == 'alpacajs') {
            $$VM.afterRender(function () {
                    $$VM.renderView({schema: propSchema, data: propData, view: pview}, object_id);
                }
            );
        }*/ else {
            if (parentView && parentView.view) {
                if (!pview) pview = {};
                pview.view = parentView.viewId;
            }

            if (!pview) {
                pview = {
                    "template": {
                        "class": parentView?.template?.class
                    },
                    "editable": parentView?.editable,
                    "autoUpdate": parentView?.autoUpdate
                };
            }
            innerCell = await pushObject(propSchema, propData, null, pview, parentKey + '.' + key, parentKey, nl_engine, env)
        }


        if (!parentCell.$html)
            parentCell.$html = [];

        parentCell.$html.push(innerCell);
    }
    else if (propSchema.type === "array") {
        // console.log('propdata', propData)
        const arrCell = {
            $html: [],
            "class": "ssArrContainer roww aa " + key,
            /*"ssid": "ssArr_" + key,
            _items: (propData && Array.isArray(propData)) ? propData : [],
            _add: function (val) {
                this._items.push(val)
                //  this.$html.push(val)
                //
                //  pushOne(propSchema.items, {}, arrCell, packet, key, parentView, parentKey);
            },
            _remove: function (i, key, t) {
                /!*console.log(this._items)
                this._items.splice(i,1);
                console.log(this._items)*!/

                eval('$$VM.localdata.' + key + '.splice(' + i + ',1) ');
                const thiz = this;
                this.$html.forEach(function (compon, index) {
                    if (compon.class && compon.class.includes(key + '[' + i + ']')) {
                        thiz.$html.splice(index, 1)
                    }
                })
                $(t).hide()
            },
            $update: function () {
                // this.$html.push({"$html":"sssssssssss"})
                const compons = {};
                pushOne(propSchema.items, {}, compons, packet, key + '[' + (this._items.length - 1) + ']', parentView, parentKey,null,null, getSchema);
                this.$html.push(compons);
                setTimeout(function () {
                    imagejob()
                });
            }*/
        };

        //var arrHeader = { "$tag": "dt",$html:[{"$html": key}] };
        const arrHeader = {"$tag": "dt", "$html": propSchema.title || key};
        const hview = getView(propSchema.items, packet ? packet.$$header : null, parentView);
        if (hview && hview.template) {
            var cells = hview.template;
            cells = ST.select(propData).transformWith(cells).root();
            if (hview.template.keyTemplate) {
                cells = cells.keyTemplate;
                cells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(cells).root();
                //render template.keyTemplate for key view
                for (var vi in cells) {
                    var valx = cells[vi];

                    arrHeader[vi] = valx;
                }
            }
        }

        if (!arrHeader.$html && editable) {
            arrHeader.$html = [
                {
                    "$tag": "dt",
                    "$html": key
                },
                {
                    "$tag": "button",
                    "class": defaultbtnclass,
                    "$html": "+",
                    "onclick": function () {
                        document.querySelector("[ssid=ssArr_" + key + "]")._add({/*empty:0*/});
                    }
                }];
        }


        arrCell.$html.push(arrHeader);

        var pview = getView(propSchema.items, packet ? packet.$$header : null, parentView);

        //if hidden in view
        if (pview && pview.hidden)
            return;

        if (pview && pview.selectable) {
            arrCell.selectable = pview.selectable;
        }

        if (pview && pview.template) {
            var tempCells = pview.template;

            if (tempCells.listContainerTemplate) {
                tempCells = tempCells.listContainerTemplate;
                if (tempCells.class) {
                    arrCell.class += ' ' + tempCells.class
                }

                tempCells = ST.select({schema: propSchema, data: packet, env: env}).transformWith(tempCells).root();

                for (var vi in tempCells) {
                    // arrCell[vi] = tempCells[vi];
                    setCells(arrCell, vi, tempCells);
                }
            }

            /*if (pview.template.absolute) {
                return parentCell;
            }*/
        }
        else if (parentView && parentView.template && parentView.template.itemsTemplate) {
            let tempCells = parentView.template.itemsTemplate;

            if (tempCells.listContainerTemplate) {
                tempCells = tempCells.listContainerTemplate;

                tempCells = ST.select({schema: propSchema, data: packet, env: env}).transformWith(tempCells).root();

                for (var vi in tempCells) {
                    // arrCell[vi] = tempCells[vi];
                    setCells(arrCell, vi, tempCells);
                }
            }
        }

        if (propData && Array.isArray(propData)) {
            /*propData.forEach(function (eachData) {
             pushOne(propSchema.items, eachData, arrCell, packet, key, parentView, parentKey);
             });*/
            for (var i = 0; i < propData.length; i++) {
                const eachData = propData[i];
                await pushOne(propSchema.items, eachData, arrCell, packet, key + '[' + i + ']', parentView, parentKey, schema, null, nl_engine, env);
                if (editable) {
                    arrCell.$html.push({
                        $tag: "button",
                        $text: "-",
                        // class: defaultbtnclass,
                        _index: i,
                        onclick: function () {
                            document.querySelector("[ssid=ssArr_" + key + "]")._remove(this._index, parentKey + '.' + key, this);
                        }
                    });
                }
            }
        } else {
            if (!propSchema.items.type || propSchema.items.type === 'object') {
                //pushOne(propSchema.items, {}, arrCell, packet, key, parentView, parentKey, schema);
            } else {
                if (parentView.editable) {
                    try {
                        const box = await getBox(packet, propSchema.items, pview, key, parentView, parentKey, schema, nl_engine, env);
                        arrCell.$html.push({$tag: "dd", $html: [box]});
                    } catch (err) {
                        logger.error(err);
                    }
                }
            }
        }

        //actions:
        // setActions(pview, propSchema, propData, key, key, arrCell);


        parentCell.$html.push(arrCell);

    } else if (propSchema.type === "jsondom") {
        parentCell.$html = parentCell.$html.concat(propData);
    } else {

        //for key values

        const newKey = {
            $tag: "dt",
            sstype: propSchema.type,
            $html: propSchema.title || (editable ? key : ""),
            class: "ss_" + key
        };
        const newValue = {
            $tag: "dd",
            sstype: propSchema.type,
            $html: propData,
            class: "ss_" + key
        };

        var pview = getView(propSchema, packet ? packet.$$header : null, parentView);

        if (!pview) {
            if (parentView && parentView.template && parentView.template.itemsTemplate) {
                pview = {"template": parentView.template.itemsTemplate};
            }
        }

        if (schema.required && schema.required.indexOf(key) > -1) {
            newKey.class += " required";
        }

        //if(parentView && parentView.editable && ( parentView.editable == true || parentView.editable.indexOf(key) > -1) ){
        if (editable) {
            const newBox = await getBox(propData, propSchema, pview, key, parentView, parentKey, schema, nl_engine, env);

            newValue.$text = "";
            newValue.$html = [newBox];
        }


        if (pview) {
            //if hidden in view
            if (pview.hidden)
                return;

            if (pview.template) {
                /**
                 * default template is for value view
                 * if template.keyTemplate exists it will render for key view
                 * if template.valueTemplate exists it will render for value view else all template would be render for value
                 *
                 */
                var cells = pview.template;
                cells = ST.select(propData).transformWith(cells).root();
                if (pview.template.keyTemplate) {
                    cells = cells.keyTemplate;
                    cells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(cells).root();
                    //render template.keyTemplate for key view
                    for (var vi in cells) {
                        var valx = cells[vi];
                        // newKey[vi] = valx;
                        setCells(newKey, vi, cells);
                    }
                }

                if (pview.template.valueTemplate) {
                    const valueTemp = {};
                    if (!pview.template.$html)
                        newValue.$html = [];
                    newValue.$html.push(valueTemp);


                    cells = pview.template.valueTemplate;
                    cells = ST.select({schema: propSchema, data: propData, parent: packet, env: env}).transformWith(cells).root();
                    //render template.valueTemplate for value view
                    for (var vi in cells) {
                        var valx = cells[vi];

                        valueTemp[vi] = valx;
                    }
                } else if (!pview.template.keyTemplate) {
                    //render template for value view
                    for (var vi in cells) {
                        var valx = cells[vi];

                        newValue[vi] = valx;
                    }
                }

            }
        } else if (!editable) {
            if (propSchema.type === 'image') {
                if (newValue['$tag'] === 'dd') {
                    Object.assign(newValue, {
                        "$tag": "img",
                        "src": propData,
                        "class": newValue.class + " img-responsive",
                        "loading": "lazy"
                    });
                    delete newValue.$html
                }
            }
        }

        if (parentView && parentView.hideTitles) {
            parentCell.$html.push(newValue);
        } else if (parentView && parentView.itemContainer) {
            let type = "div";
            if (parentView.itemContainer !== true)
                type = parentView.itemContainer;
            let container = {
                "$tag": type,
                "class": "ssItemContainer ss" + key,
                "$html": [newKey, newValue]
            };
            let cells = {...pview?.template?.objectTemplate};
            cells = ST.select(propData).transformWith(cells).root();
            for (var vi in cells) {
                // var valx = cells[vi];
                // newKey[vi] = valx;
                setCells(container, vi, cells);
            }
            parentCell.$html.push(container);
        } else {
            parentCell.$html.push(newKey, newValue);
        }
    }
}

/*

let x = {
    $tag: 'p',
    attr1: 'val1',
    attr2: 333,
    $text: 'Hi Bye',
    $html: [
        {
            $tag: 'input',
            type: 'number',
            value: '123'
        },
        {
            $tag: 'img',
            src: 'aaa/adafda.jpg'
        },
        {
            $tag: 'ol',
            style: {
                color: 'red',
                'font-size': '14px'
            },
            $html: [
                {
                    $tag: 'li',
                    $text: 'hello'
                },
                {
                    $tag: 'li',
                    $text: 'BYE'
                }
            ]
        }
    ]
}

// console.log(render_object(x,false));

let schema = {
    "$id": "chats",
    "type": "object",
    "properties": {
        "who": {
            "type": "string",
            "title": "who is"
        },
        "room": {
            "type": "string",
            "enum": ["Nolang","Java","JavaScript","Go"],
            "title": "room name"
        },
        "message": {
            "type": "string",
            "title": "message"
        },
        "time": {
            "type": "date",
            "title": "time of message",
            "default": "{{new Date()}}"
        }
    },
    $$rules: [
        {
            ruleId: "testRule1",
            ruleType: 'trigger',
            ruleTime: 'beforeCreate',
            ruleDef: {
                $$schema: 'console',
                $$header: {
                    action: 'M',
                    method: 'log',
                    params: {
                        message: '-------------------before create --------------------'
                    }
                }
            }
        },
        {
            ruleId: "testRule1",
            ruleType: 'trigger',
            ruleTime: 'afterCreate',
            ruleDef: {
                $$schema: 'console',
                $$header: {
                    action: 'M',
                    method: 'log',
                    params: {
                        message: '-------------------after create --------------------'
                    }
                }
            }
        },
        /!*{
            ruleId: "testRule1",
            ruleType: 'trigger',
            ruleTime: 'every',
            schedule: '*!//!*2 * * * * *',
                    ruleDef: {
                        $$schema: 'console',
                        $$header: {
                            action: 'M',
                            method: 'log',
                            params: {
                                message: '-------------------every XXXX --------------------'
                            }
                        }
                    }
                }*!/
    ]
}

let data = [
    {
        "who": "maman",
        "room": "JavaScript",
        "message": 411,
        "time": 1657123388669,
        "$$record": {
            "action": "C",
            "time": 1657123388685
        },
        "$$objid": "6d9e11d6-34ac-4186-b94e-684e16fe857f"
    },
    {
        "who": "maman",
        "room": "Go",
        "message": 767,
        "time": 1657123388693,
        "$$record": {
            "action": "C",
            "time": 1657123388707
        },
        "$$objid": "a78192ee-7662-49d0-8071-e19b5881ed30"
    },
    {
        "who": "maman",
        "room": "Nolang",
        "message": 551,
        "time": 1657123388717,
        "$$record": {
            "action": "C",
            "time": 1657123388730
        },
        "$$objid": "1cde1df9-2c69-402d-942a-9197ef3f6b11"
    },
    {
        "who": "maman",
        "room": "Nolang",
        "message": 819,
        "time": 1657123388736,
        "$$record": {
            "action": "C",
            "time": 1657123388749
        },
        "$$objid": "97da9708-303f-4e24-acd7-0ea180db4600"
    },
    {
        "who": "maman",
        "room": "JavaScript",
        "message": 850,
        "time": 1657123388753,
        "$$record": {
            "action": "C",
            "time": 1657123388766
        },
        "$$objid": "40b36e87-38f2-4617-8e9a-1efaf816d0d1"
    },
    ];

let view = {
    template: {
        // $tag : 'div',
        // $text: '{{data.who}}'
    }
}
console.log(render_object(pushObject(schema, data, null, view, 'chat', null)));
*/

/*const {deepEach} = require('../tools/deepeach');
const _ = require('lodash');*/
module.exports = async function (schema, view, data, nl_engine, env) {
    //todo
    if(typeof data === 'object' && data.success === false) {
        return "<br><h3 align='center' style='color: red'>You have not Permission!</h3>"
    }
    /*let _schema = {...schema};

    deepEach(_schema, function (k, obj) {
        let v = obj[k];
        if (k === '$ref' && v.startsWith('#')) {

            delete obj[k];
            Object.assign(obj, _.get(_schema, v.replaceAll('#/','').replaceAll('/','.')))
        }
    });*/
    let domObject = await pushObject(schema, data, null, view, schema.$id, null, nl_engine, env);
    return render_object(domObject)
}
