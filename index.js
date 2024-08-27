const express = require("express");
const app = express();
const porta = 3000;
const fs = require('fs');

//Ler arquivo JSON
//Gerado em: https://extendsclass.com/json-generator.html
var obj = JSON.parse(fs.readFileSync('sample.json', 'utf8'));

//Configuração das rotas
//Rota GET padrão
app.get("/", function(req, res){
    res.send("Olá mundo!");
});

//Rota para retornar conteúdo do arquivo JSON
app.get("/json", function(req,res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
});

//Iniciar servidor
app.listen(porta, function(){
    console.log("Servidor iniciado na porta: " + porta);
});