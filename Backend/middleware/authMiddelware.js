const ensureAuthenticatedStudent = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.type !="student") {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};

const ensureAuthenticatedWarden = (req, res, next) => {
    if (!req.session || !req.session.user || (req.session.user.type !== "warden" && req.session.user.type !== "superior")) {  
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};

const ensureAuthenticatedSuperior = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.type !="superior") {  
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};

const ensureAuthenticatedSecurity = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.type !="security") {  
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};
const ensureAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {  
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};

module.exports = {
    ensureAuthenticatedStudent,
    ensureAuthenticatedWarden,
    ensureAuthenticatedSuperior,
    ensureAuthenticatedSecurity,
    ensureAuthenticated
};
