require('dotenv').config()
const mysql = require('mysql2/promise');
const mysql2 = require('mysql2');
const ProyeccionCP = require("./proyeccioncp");
const ProyeccionCPNoLineal = require("./proyeccioncpnolineal");
const ProyeccionLP = require("./proyeccionlp");
const ProyeccionLPNoLineal = require("./proyeccionlpnolineal");
const RentabilidadCP = require("./rentabilidadcp");
const RentabilidadLP = require("./rentabilidadlp");
const { database } = require('./keys');
const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});
exports.handler = async function (event) {
    const promise = new Promise(async function() {
        const conexion = await mysql.createConnection({
            host: database.host,
            user: database.user,
            password: database.password,
            port: database.port,
            database: database.database
        });
        const conn = mysql2.createConnection({
            host: database.host,
            user: database.user,
            password: database.password,
            port: database.port,
            database: database.database
        });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const client = await auth.getClient();
        const googleSheet = google.sheets({ version: 'v4', auth: client });
        try {
            const proyeccioneslp = [];
            const proyeccioneslpnolineales = [];
            const proyeccionescp = [];
            const proyeccionescpnolineales = [];
            const rentabilidadeslp = [];
            const rentabilidadescp = [];
            var requestProyeccionesLP = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_PROY_LP}`
            })).data;
            var requestProyeccionesCP = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_PROY_CP}`
            })).data;
            var requestRentabilidadesLP = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_RENT_LP}`
            })).data;
            var requestRentabilidadesCP = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_RENT_CP}`
            })).data;
            var requestProyeccionesLPNoLineal = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_PROY_LP_NOLINEAL}`
            })).data;
            var requestProyeccionesCPNoLineal = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA_PROY_CP_NOLINEAL}`
            })).data;
            var recogerProyeccionesLP = requestProyeccionesLP.values;
            var recogerProyeccionesCP = requestProyeccionesCP.values;
            var recogerRentabilidadesLP = requestRentabilidadesLP.values;
            var recogerRentabilidadesCP = requestRentabilidadesCP.values;
            var recogerProyeccionesLPNoLineal = requestProyeccionesLPNoLineal.values;
            var recogerProyeccionesCPNoLineal = requestProyeccionesCPNoLineal.values;
            var sql = `SELECT * FROM ${process.env.TABLE_PRECIO_ACTUAL}`;
            const [rows, fields] = await conexion.execute(sql);
            var [rows2, fields2] = [];
            var [rows3, fields3] = [];
            var [rows4, fields4] = [];
    
            for (let i = 0; i < recogerProyeccionesLP.length; i++) {
                var cripto = recogerProyeccionesLP[i][0].toString();
                var fecha = recogerProyeccionesLP[i][1].toString();
                var forecast = parseFloat(recogerProyeccionesLP[i][3]).toFixed(6);
                var pesimista = parseFloat(recogerProyeccionesLP[i][4]).toFixed(6);
                var optimista = parseFloat(recogerProyeccionesLP[i][5]).toFixed(6);
                var idGrupo = parseInt(recogerProyeccionesLP[i][6]);
                var idPrecio = null;
                for (let j = 0; j < rows.length; j++) {
                    if (rows[j]) {
                        let fechaBase = new Date(rows[j].fecha);
                        let dia = fechaBase.getDate();
                        let mes = fechaBase.getMonth()+1;
                        let year = fechaBase.getFullYear();
                        if (dia <= 9) {
                            dia = `0${dia}`;
                        }
                        if (mes <= 9) {
                            mes = `0${mes}`;
                        }
                        var fechaTransformada = `${year}-${mes}-${dia}`;
                        if (fechaTransformada == fecha && rows[j].name == cripto) {
                            idPrecio = rows[j].id;
                            break;
                        } else {
                            var search = 0;
                            for (let k = 0; k < rows.length; k++) {
                                if(cripto == rows[k].name && fecha == fechaTransformada) {
                                    search++;
                                    break;
                                }
                            }
                            if (recogerProyeccionesLP[i][2] && search == 0) {
                                let sql1 = `INSERT INTO ${process.env.TABLE_PRECIO_ACTUAL}(
                                    name,
                                    fecha,
                                    precio
                                ) SELECT * FROM (SELECT 
                                    "${cripto}" AS name,
                                    "${fecha}" AS fecha,
                                    ${recogerProyeccionesLP[i][2]} AS precio
                                ) AS tmp
                                WHERE NOT EXISTS (
                                    SELECT name, fecha FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha = "${fecha}" 
                                ) LIMIT 1`;
                                let sql2 = `SELECT id FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha="${fecha}"`;
                                await conexion.execute(sql1);
                                [rowsData, fieldsData] = await conexion.execute(sql2);
                                idPrecio = rowsData[0].id;
                                break;   
                            }
                        }
                    }
                }
                let newProyeccionLP = new ProyeccionLP(
                    cripto,
                    fecha,
                    idPrecio,
                    forecast,
                    pesimista,
                    optimista,
                    idGrupo
                );
                newProyeccionLP.push(proyeccioneslp);
                if (i == recogerProyeccionesLP.length-1) {
                    [rows2, fields2] = await conexion.execute(sql);
                }
            }
            for (let i = 0; i < recogerProyeccionesCP.length; i++) {
                var cripto = recogerProyeccionesCP[i][0].toString();
                var fecha = recogerProyeccionesCP[i][1].toString();
                var forecast = parseFloat(recogerProyeccionesCP[i][3]).toFixed(6);
                var pesimista = parseFloat(recogerProyeccionesCP[i][4]).toFixed(6);
                var optimista = parseFloat(recogerProyeccionesCP[i][5]).toFixed(6);
                var idGrupo = parseInt(recogerProyeccionesCP[i][6]);
                var idPrecio = null;
                for (let j = 0; j < rows2.length; j++) {
                    if (rows2[j]) {
                        let fechaBase = new Date(rows2[j].fecha);
                        let dia = fechaBase.getDate();
                        let mes = fechaBase.getMonth()+1;
                        let year = fechaBase.getFullYear();
                        if (dia <= 9) {
                            dia = `0${dia}`;
                        }
                        if (mes <= 9) {
                            mes = `0${mes}`;
                        }
                        var fechaTransformada = `${year}-${mes}-${dia}`;
                        if (fechaTransformada == fecha && rows2[j].name == cripto) {
                            idPrecio = rows2[j].id;
                            break;
                        } else {
                            var search = 0;
                            for (let k = 0; k < rows2.length; k++) {
                                if(cripto == rows2[k].name && fecha == fechaTransformada) {
                                    search++;
                                    break;
                                }
                            }
                            if (recogerProyeccionesCP[i][2] && search == 0) {
                                let sql1 = `INSERT INTO ${process.env.TABLE_PRECIO_ACTUAL}(
                                    name,
                                    fecha,
                                    precio
                                ) SELECT * FROM (SELECT 
                                    "${cripto}" AS name,
                                    "${fecha}" AS fecha,
                                    ${recogerProyeccionesCP[i][2]} AS precio
                                ) AS tmp
                                WHERE NOT EXISTS (
                                    SELECT name, fecha FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha = "${fecha}" 
                                ) LIMIT 1`;
                                let sql2 = `SELECT id FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha="${fecha}"`;
                                await conexion.execute(sql1);
                                let [rowsData, fieldsData] = await conexion.execute(sql2);
                                idPrecio = rowsData[0].id;
                                break;   
                            }
                        }
                    }
                }
                let newProyeccionCP = new ProyeccionCP(
                    cripto,
                    fecha,
                    idPrecio,
                    forecast,
                    pesimista,
                    optimista,
                    idGrupo
                );
                newProyeccionCP.push(proyeccionescp);
                if (i == recogerProyeccionesCP.length-1) {
                    [rows3, fields3] = await conexion.execute(sql);
                }
            }
            for (let i = 0; i < recogerRentabilidadesLP.length; i++) {
                var secuencial = recogerRentabilidadesLP[i][0];
                var escenario = recogerRentabilidadesLP[i][1];
                var cripto = recogerRentabilidadesLP[i][2];
                var d30 = recogerRentabilidadesLP[i][3];
                var m3 = recogerRentabilidadesLP[i][4];
                var m6 = recogerRentabilidadesLP[i][5];
                var a1 = recogerRentabilidadesLP[i][6];
                var idGrupo = recogerRentabilidadesLP[i][7];
                let newRentabilidadLP = new RentabilidadLP(
                    secuencial,
                    escenario,
                    cripto,
                    d30,
                    m3,
                    m6,
                    a1,
                    idGrupo
                );
                newRentabilidadLP.push(rentabilidadeslp);
            }
            for (let i = 0; i < recogerRentabilidadesCP.length; i++) {
                var secuencial = recogerRentabilidadesCP[i][0];
                var escenario = recogerRentabilidadesCP[i][1];
                var cripto = recogerRentabilidadesCP[i][2];
                var d15 = recogerRentabilidadesCP[i][3];
                var d30 = recogerRentabilidadesCP[i][4];
                var d45 = recogerRentabilidadesCP[i][5];
                var idGrupo = recogerRentabilidadesCP[i][6];
                let newRentabilidadCP = new RentabilidadCP(
                    secuencial,
                    escenario,
                    cripto,
                    d15,
                    d30,
                    d45,
                    idGrupo
                );
                newRentabilidadCP.push(rentabilidadescp);
            }
            for (let i = 0; i < recogerProyeccionesLPNoLineal.length; i++) {
                var cripto = recogerProyeccionesLPNoLineal[i][0].toString();i
                var fecha = recogerProyeccionesLPNoLineal[i][1].toString();
                var forecast = parseFloat(recogerProyeccionesLPNoLineal[i][3]).toFixed(6);
                var pesimista = parseFloat(recogerProyeccionesLPNoLineal[i][4]).toFixed(6);
                var optimista = parseFloat(recogerProyeccionesLPNoLineal[i][5]).toFixed(6);
                var idGrupo = parseInt(recogerProyeccionesLPNoLineal[i][6]);
                var idPrecio = null;
                for (let j = 0; j < rows3.length; j++) {
                    if (rows3[j]) {
                        let fechaBase = new Date(rows3[j].fecha);
                        let dia = fechaBase.getDate();
                        let mes = fechaBase.getMonth()+1;
                        let year = fechaBase.getFullYear();
                        if (dia <= 9) {
                            dia = `0${dia}`;
                        }
                        if (mes <= 9) {
                            mes = `0${mes}`;
                        }
                        var fechaTransformada = `${year}-${mes}-${dia}`;
                        if (fechaTransformada == fecha && rows3[j].name == cripto) {
                            idPrecio = rows3[j].id;
                            break;
                        } else {
                            var search = 0;
                            for (let k = 0; k < rows3.length; k++) {
                                if(cripto == rows3[k].name && fecha == fechaTransformada) {
                                    search++;
                                    break;
                                }
                            }
                            if (recogerProyeccionesLPNoLineal[i][2] && search == 0) {
                                let sql1 = `INSERT INTO ${process.env.TABLE_PRECIO_ACTUAL}(
                                    name,
                                    fecha,
                                    precio
                                ) SELECT * FROM (SELECT 
                                    "${cripto}" AS name,
                                    "${fecha}" AS fecha,
                                    ${recogerProyeccionesLPNoLineal[i][2]} AS precio
                                ) AS tmp
                                WHERE NOT EXISTS (
                                    SELECT name, fecha FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha = "${fecha}" 
                                ) LIMIT 1`;
                                let sql2 = `SELECT id FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha="${fecha}"`;
                                await conexion.execute(sql1);
                                let [rowsData, fieldsData] = await conexion.execute(sql2);
                                idPrecio = rowsData[0].id;
                                break;   
                            }
                        }
                    }
                }
                let newProyeccionLPNoLineal = new ProyeccionLPNoLineal(
                    cripto,
                    fecha,
                    idPrecio,
                    forecast,
                    pesimista,
                    optimista,
                    idGrupo
                );
                newProyeccionLPNoLineal.push(proyeccioneslpnolineales);
                if (i == recogerProyeccionesLPNoLineal.length-1) {
                    [rows4, fields4] = await conexion.execute(sql);
                }
            }
            for (let i = 0; i < recogerProyeccionesCPNoLineal.length; i++) {
                var cripto = recogerProyeccionesCPNoLineal[i][0].toString();
                var fecha = recogerProyeccionesCPNoLineal[i][1].toString();
                var forecast = parseFloat(recogerProyeccionesCPNoLineal[i][3]).toFixed(6);
                var pesimista = parseFloat(recogerProyeccionesCPNoLineal[i][4]).toFixed(6);
                var optimista = parseFloat(recogerProyeccionesCPNoLineal[i][5]).toFixed(6);
                var idGrupo = parseInt(recogerProyeccionesCPNoLineal[i][6]);
                var idPrecio = null;
                for (let j = 0; j < rows4.length; j++) {
                    if (rows4[j]) {
                        let fechaBase = new Date(rows4[j].fecha);
                        let dia = fechaBase.getDate();
                        let mes = fechaBase.getMonth()+1;
                        let year = fechaBase.getFullYear();
                        if (dia <= 9) {
                            dia = `0${dia}`;
                        }
                        if (mes <= 9) {
                            mes = `0${mes}`;
                        }
                        var fechaTransformada = `${year}-${mes}-${dia}`;
                        if (fechaTransformada == fecha && rows4[j].name == cripto) {
                            idPrecio = rows4[j].id;
                            break;
                        } else {
                            var search = 0;
                            for (let k = 0; k < rows4.length; k++) {
                                if(cripto == rows4[k].name && fecha == fechaTransformada) {
                                    search++;
                                    break;
                                }
                            }
                            if (recogerProyeccionesCPNoLineal[i][2] && search == 0) {
                                let sql1 = `INSERT INTO ${process.env.TABLE_PRECIO_ACTUAL}(
                                    name,
                                    fecha,
                                    precio
                                ) SELECT * FROM (SELECT 
                                    "${cripto}" AS name,
                                    "${fecha}" AS fecha,
                                    ${recogerProyeccionesCPNoLineal[i][2]} AS precio
                                ) AS tmp
                                WHERE NOT EXISTS (
                                    SELECT name, fecha FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha = "${fecha}" 
                                ) LIMIT 1`;
                                let sql2 = `SELECT id FROM ${process.env.TABLE_PRECIO_ACTUAL} WHERE name="${cripto}" AND fecha="${fecha}"`;
                                await conexion.execute(sql1);
                                let [rowsData, fieldsData] = await conexion.execute(sql2);
                                idPrecio = rowsData[0].id;
                                break;   
                            }
                        }
                    }
                }
                let newProyeccionCPNoLineal = new ProyeccionCPNoLineal(
                    cripto,
                    fecha,
                    idPrecio,
                    forecast,
                    pesimista,
                    optimista,
                    idGrupo
                );
                newProyeccionCPNoLineal.push(proyeccionescpnolineales);
            }
            await agregarDatos(proyeccioneslp, process.env.TABLE_CRIPTO_PROY_LP);
            await agregarDatos(proyeccionescp, process.env.TABLE_CRIPTO_PROY_CP);
            await agregarDatos(rentabilidadeslp, process.env.TABLE_CRIPTO_RENT_LP);
            await agregarDatos(rentabilidadescp, process.env.TABLE_CRIPTO_RENT_CP);
            await agregarDatos(proyeccioneslpnolineales, process.env.TABLE_CRIPTO_PROY_LP_NOLINEAL);
            await agregarDatos(proyeccionescpnolineales, process.env.TABLE_CRIPTO_PROY_CP_NOLINEAL);
            await finalizarEjecucion();
        } catch (err) {
            console.error(err);
        }
    
        async function agregarDatos(datos, table) {
            console.log(datos);
            if (!datos || datos[0][0]==="#N/A") {
                console.log("No se encontraron datos.");
                return;
            } else {
                let sql1 = `DELETE FROM ${table} WHERE id_grupo=${datos[0].id_grupo}`;
                let sql2 = `ALTER TABLE ${table} AUTO_INCREMENT=1`;
                conn.query(sql1, function (err, result) {
                    if (err) throw err;
                });
                conn.query(sql2, function (err, result) {
                    if (err) throw err;
                });
                let sql3 = `INSERT INTO ${table} SET ?`;
                for (let i = 0; i < datos.length; i++) {
                    const element = datos[i];
                    conn.query(sql3, [element], function (err, result) {
                        if (err) throw err;
                    });   
                }    
                console.log(`Agredados ${datos.length} datos a ${table}`);
            }
        };
        async function finalizarEjecucion() {
            conexion.end();
        };
    });
    return promise
}