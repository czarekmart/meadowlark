
module.exports.initilizeAPIs = function(app){

    // We include package CORS (Cross-Origin Resource Sharing)
    // to enable APIs only to paths starting with /api
    var cors = require('cors');
    console.log('cors:');
    console.log(cors);

    app.use('/api', cors);

    app.get('/api', function(req, res){

        // Not implemented: I am going to skip chapter 15.
        return res.render('home');
    });
};
