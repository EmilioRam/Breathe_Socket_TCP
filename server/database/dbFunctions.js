let mysql = require('mysql');
const Colors = require('colors');


let connection;


const dbConnect = () => {

    const attemptConnection = () => {
        // Cogemos los datos para la conexión de las variables de entorno
        connection = mysql.createConnection({
            host: process.env.HOST_DB,
            user: process.env.USER_DB,
            password: process.env.PASS_DB,
            database: process.env.DATABASE,
            connectTimeout: 15000,
            port: process.env.PORT_DB
        });


        connection.connect(function(err) {
            if (err) {
                console.log("error conectando a la BD, reintentando...".bgRed);
                console.error(`error connecting to DB: ${err.stack}`.red);
                //throw new Error(`error connecting to DB: ${err.stack}`.red)
                connection.destroy();
                setTimeout(attemptConnection, 15000)
            } else {
                console.log(`connected as id ${connection.threadId} to database ${process.env.DATABASE}`.green);
            }

        });
    }

    attemptConnection();

}

const storeDb = (data) => {



    if (!connection) {

        // console.log('No hay conexión con la base de datos'.red);
        throw new Error('No hay conexión con la base de datos');

    } else {

        const dataStructure = JSON.parse(process.env.DATA_STRUCTURE);

        n_props = Object.values(dataStructure).length;
        let columnsString = '(';
        let valuesString = '(';

        cont = 1;

        for (const property in dataStructure) {
            //console.log(`${property}: ${dataStructure[property]}`);
            if (cont < n_props) {
                columnsString += `${property}, `
                valuesString += `${data[property]}, `
            } else {
                columnsString += `${property})`
                valuesString += `${data[property]})`
            }
            cont++;
        }

        // console.log(columnsString);
        // console.log(valuesString);


        // connection.query('SELECT 1 + 1 AS solution', function(error, results, fields) {
        connection.query(`INSERT INTO ${process.env.TABLENAME} ${columnsString} VALUES ${valuesString}`, async function(error, results, fields) {
            if (error) {
                console.log(`${error}`.red);
                throw new Error('Fallo al escribir en la base de datos');
            }
            // Si todo ha ido bien
            //console.log('The solution is: ', results[0].solution);

        });

        // Aquí solo llega si no ha habido ningún error (TODO: HACER SYNC AWAIT del query)
        return 'datos guardados en la DB';

    }

}


module.exports = {
    dbConnect,
    storeDb
}