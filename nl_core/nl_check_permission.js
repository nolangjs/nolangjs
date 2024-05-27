const jwt = require('jsonwebtoken');

async function checkRolesPermission(roles, packet, env) {
    //TODO create permission routing logs
    //TODO return permission messages to user

    const header = packet.$$header;
    let userAction = (header && header.action) ? header.action : '' ;

    let hasPermission = false;

    let ret = {
        success: false
    };

    let userid = null;
    let userRoles = null;

    if(env?.request?.cookies) {
        let token = null;
        let jwtcookiename = this.conf.user.jwt?.cookie?.name || 'jwt';
        if(env?.request?.cookies[jwtcookiename]) {
            token = env.request.cookies[jwtcookiename];
            try{
                let decoded = jwt.verify(token, this.conf.user.jwt?.secret);
                userid = decoded.userid;
                userRoles = decoded.roles;
                if(this.conf.user.token) {
                    //todo , token table instead of roles in jwt token
                    //todo , jwt OR token table
                    let _users = await this.dataPacket({
                        $$schema: this.conf.user.token.schema,
                        $$header: {
                            action: 'R',
                            filter: {
                                [this.conf.user.token.tokenField]: _username,
                                // [this.conf.user.passwordField]: _password
                            },
                            cache: {
                                key: new Buffer( _username+_password).toString('base64'), //fixme encrypt it
                                time: 100
                            }
                        }
                    }, null, {}, true);
                    if (_users.length < 1) {
                        logger.error('No user with this username', _username);
                        ret.error = 'No user with this username';
                        return ret;
                    }
                    let userid = _users[0][this.conf.user.token.useridField];
                }
            } catch (err) {
                ret.error = err;
                return ret;
            }
        }
    }

    if (header.user) {
        // this.currentUser = header.user;
        if (header.user.userid)
            userid = header.user.userid;

        if (header.user.roles){
            if(!this.conf.user.directRoles) {
                ret.error = "No permission to direct roles";
                return ret;
            }
            userRoles = header.user.roles;
        } else
            //jwt token
        if (header.user.token) {
            try {
                let decoded = jwt.verify(header.user.token, this.conf.user.jwt?.secret);
                if (decoded.userid)
                    userid = decoded.userid;
                userRoles = decoded.roles;
                //todo , token table instead of roles in jwt token
            } catch (err) {
                ret.error = err;
                return ret;
            }
        } else
            //if header.user has username and password
        if (header.user.username) {
            if (header.user.password) {
                if (this.conf.user.schema) {
                    let _username = header.user[this.conf.user.usernameField] || header.user.username || header.user.user;
                    let _password = header.user[this.conf.user.passwordField] || header.user.password || header.user.pass;
                    let _users = await this.dataPacket({
                        $$schema: this.conf.user.schema,
                        $$header: {
                            action: 'R',
                            filter: {
                                [this.conf.user.usernameField]: _username,
                                // [this.conf.user.passwordField]: _password
                            },
                            cache: {
                                key: new Buffer( _username+_password).toString('base64'), //fixme encrypt it
                                time: 100
                            }
                        }
                    }, null, {}, true);
                    if (_users.length < 1) {
                        logger.error('No user with this username', _username);
                        ret.error = 'No user with this username';
                        return ret;
                    }
                    let user = _users[0];
                    if (user[this.conf.user.passwordField] !== _password) {
                        logger.error('No user with this username password', _username);
                        ret.error = 'No user with this username password';
                        return ret;
                    }
                    userRoles = user[this.conf.user.rolesField];
                    if (this.conf.user.jwt) {
                        // let _user = {...user};
                        // delete _user[this.conf.user.passwordField];
                        //todo how to delete other unneeded fields?
                        let newToken = {
                            userid: user.$$objid,
                            roles: userRoles
                        };
                        let token = jwt.sign(newToken, this.conf.user.jwt.secret, {expiresIn: this.conf.user.jwt.expiresIn});

                        if (this.conf.user.jwt.cookie) {
                            ret.cookie = {
                                vals: {
                                    [(this.conf.user.jwt.cookie.name) || 'jwt']: token
                                },
                                options: this.conf.user.jwt.cookie.options || {
                                    httpOnly: true,
                                    signed: true,
                                    maxAge: this.conf.user.jwt.expiresIn || 3600*24,
                                }
                            }
                        } else {
                            ret.token = token;
                        }

                        return ret;
                    }
                }
            }
        } else
        if (header.user.userid) {
            if (!userRoles) {

            }
        }

    }
    /* else {
        if(this.currentUser){
            userRoles = this.currentUser.roles;
        }
    }*/

    let _role = null;
    for (let r = 0; r < roles.length; r++) {
        let role = roles[r];

        //roleid *
        if(role.roleId === '*') {
            if(
                role.permissions.some(per => per.access.includes(userAction))
                ||
                role.permissions.some(per => per.access.includes("A"))
            ){
                hasPermission = true;
                _role = role;
                break;
            }
        }

        if (userRoles) {
            if (userRoles.some(ur => ur === role.roleId &&
                (
                    role.permissions.some(per => per.access.includes(userAction))
                    ||
                    role.permissions.some(per => per.access.includes("A")))
            ) )
            {
                hasPermission = true;
                _role = role;
                break;
            }
        }
    }

    if (hasPermission) {
        //check rules of role todo not good place
        env.userid = userid;
        env.userRoles = userRoles;
        if (_role.filter) {//todo document of role.filter
            /*for (let rule of _role.$$rules) {
                if (rule.filter) {
                    logger.log(rule.ruleDef)*/
                    if (packet.$$header) {
                        if (!packet.$$header.filter) {
                            packet.$$header.filter = {}
                        }
                        Object.assign(packet.$$header.filter, this.handlePacket(_role.filter, {script:packet, env: env}));
                    }
                /*}
            }*/
        }
        ret.hasPermission = true;
        return ret;
    }

    let er = "not permission " + userAction + " in schema  " + packet.$$schema;
    logger.error(er);
    ret.error = er;
    return ret;
}

module.exports = checkRolesPermission;
