function hello(req,res,next) {
    res.write('Hello \n');
    next();
}

function bye(req, res, next) {
    res.write('Bye \n');
    res.end();
}

app.get('/hello',hello,bye); 

