const jwt = require('jsonwebtoken');

async function checkRolesPermission(roles, packet, env) {
    //TODO create permission routing logs
    //TODO return permission messages to user

    const header = packet.$$header;
    let userAction = header?.action || '' ;

    let hasPermission = false;

    let ret = {
        success: false
    };

    let userid;
    let userRoles;
    let user;
    let token;

    //find token in http request cookies
    if(env?.request?.cookies) {
        let jwtcookiename = this.conf.user.jwt?.cookie?.name || 'jwt';
        token = env.request.cookies[jwtcookiename];
    }

    //find token in headers.authorization
    if(env?.request?.headers?.authorization) {
        if(env.request.headers.authorization.split(' ')[1])
            token = env.request.headers.authorization.split(' ')[1];
    }

    //header.user
    if (header.user) {
        if (header.user.roles) {
            if(!this.conf.user?.directRoles) {
                ret.error = "No permission to use roles in request directly. conf.user.directRoles is false";
                return ret;
            }
            userRoles = header.user.roles;
        }
        else if (header.user.token) {
            token = header.user.token;
        }
        else if (header.user.username) {
            if (header.user.password) {
                if (this.conf.user?.schema) {
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
                    let _user = _users[0];
                    if (_user[this.conf.user.passwordField] !== _password) {
                        logger.error('No user with this username password', _username);
                        ret.error = 'No user with this username password';
                        return ret;
                    }
                    userid = _user.$$objid;
                    user = {..._user};
                    delete user[this.conf.user.passwordField];
                    userRoles = user[this.conf.user.rolesField];
                    if (this.conf.user.jwt) {
                        //create new token and save in jwt cookie
                        //todo add config which fields are needed to store in jwt
                        let newToken = {
                            userid: user.$$objid,
                            roles: userRoles,
                            user: user
                        };
                        newToken = jwt.sign(newToken, this.conf.user.jwt.secret, {expiresIn: this.conf.user.jwt.expiresIn});

                        if (this.conf.user.jwt.cookie) {
                            ret.cookies = {
                                [(this.conf.user.jwt.cookie?.name) || 'jwt'] : {
                                    value: newToken,
                                    options: this.conf.user.jwt.cookie?.options || {
                                        httpOnly: true,
                                        signed: true,
                                        maxAge: this.conf.user.jwt.expiresIn || 3600 * 24,
                                    }
                                }
                            }
                        } else {
                            ret.token = newToken;
                        }

                        return ret;
                    }
                }
            }
        }
        else if (header.user.userid) {
            if(!this.conf.user?.directUserId) {
                ret.error = "No permission to use userid in request directly. conf.user.directUserId is false";
                return ret;
            }
            userid = header.user?.userid;
        }
    }

    if(token) {
        try{
            if(this.conf.user.token?.schema) {
                //tokens schema, maps tokens with userids
                //finding token in tokens schema:
                let _tokens = await this.dataPacket({
                    $$schema: this.conf.user.token.schema,
                    $$header: {
                        action: 'R',
                        filter: {
                            [this.conf.user.token.tokenField]: token,
                        },
                        cache: {
                            key: new Buffer(token).toString('base64'), //fixme encrypt it
                            time: 100
                        }
                    }
                }, null, {}, true);
                if (_tokens.length < 1) {
                    logger.error('No user with this token', token);
                    ret.error = 'No user with this token '+token;
                    return ret;
                }
                userid = _tokens[0][this.conf.user.token.useridField];
            }
            else {
                let decoded = jwt.verify(token, this.conf.user.jwt?.secret);
                userid = decoded.userid;
                userRoles = decoded.roles;
                user = decoded.user;
            }

        } catch (err) {
            ret.error = err;
            return ret;
        }
    }

    if(userid && !userRoles) {
        //finding user
        let _users = await this.dataPacket({
            $$schema: this.conf.user.schema,
            $$header: {
                action: 'R',
                filter: {
                    $$objid: userid,
                },
                cache: {
                    key: new Buffer(userid).toString('base64'), //fixme encrypt it
                    time: 100
                }
            }
        }, null, {}, true);
        if (_users.length < 1) {
            logger.error('No user with this id', userid);
            ret.error = 'No user with this id '+userid;
            return ret;
        }
        user = _users[0];
        delete user[this.conf.user.passwordField];
        userRoles = user[this.conf.user.rolesField];
    }

    let _role = null;
    for (let r = 0; r < roles.length; r++) {
        let role = roles[r];

        //for roleid equal to *
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
        env.userid = userid;
        env.userRoles = userRoles;
        env.user = user;
        //check rules of role todo not good place
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
