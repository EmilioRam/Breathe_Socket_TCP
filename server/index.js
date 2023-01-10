// ----------CONFIGS (de variables de entorno)------------
// Las variables de entorno que debemos configurar son:

// PORT = Puerto configurado para escuchar
// HOST_DB = 'url de la BD MySQL'
// USER_DB = 'Usuario'
// PASS_DB = 'pass'
// DATABASE = 'Nombre de la DB'
// TABLENAME = 'nombre de la tabla'
// // La codificación de la estructura es KEY: {nro de bytes, tipo} (para caso trama de Bytes)
// // (donde se especifica el nro de bytes y el tipo de cada medida en la trama).
// // Tb se especifica un divisor por si hay un decimal que se transmite como entero y hay que dividirlo
// // para obtener el valor real
// // Hay 2 tipos especiales "Validation" y "Flag":
// // - 'Flag' especifica un byte en el que se incluyen varios bits separados para diferentes valores,
// //    indicando en este caso la posición del bit inicial y cuantos bits se deben leer
// //    (desde menos significativo a más). En el último bit se especifica el nbytes (los anteriores "nbytes":0).
// // - 'Validation' especifica, si hay uno o barios bytes con bits de verificación para algunos parámetros
// //   (en caso de que alguna lectura no sea válida desde el origen se indicará aquí),
// //   indicando el mapa de qué bit valida qué parámetro de los incluidos en la estructura 

// // ejemplo:
// DATA_STRUCTURE = '{ "VALID_DATA":       {"nbytes": 1, "type": "Validation", "div": 1, 
//                                              "map": {
//                                                  "7":["PARTICLES_1", "PARTICLES_2_5", "PARTICLES_4", "PARTICLES_10"],
//                                                  "6":["GASES_CO"],
//                                                  "5":["GASES_NO2"],
//                                                  "4":["GASES_SO2"],
//                                                  "3":["GASES_O3"],
//                                                  "2":["TEMPERATURE", "HUMIDITY"],
//                                                  "1":["CO2"],
//                                                  "0":["GPS_LATITUDE", "GPS_LONGITUDE"]
//                                              }
//                      },
//                      "PARTICLES_1":      {"nbytes": 2, "type": "Int", "div": 10},
//                      "PARTICLES_2_5":    {"nbytes": 2, "type": "Int", "div": 10},
//                      "PARTICLES_4":      {"nbytes": 2, "type": "Int", "div": 10},
//                      "PARTICLES_10":     {"nbytes": 2, "type": "Int", "div": 10},
//                      "GASES_CO":         {"nbytes": 2, "type": "Int", "div": 10},
//                      "GASES_NO2":        {"nbytes": 2, "type": "Int", "div": 10},
//                      "GASES_SO2":        {"nbytes": 2, "type": "Int", "div": 10},
//                      "GASES_O3":         {"nbytes": 2, "type": "Int", "div": 10},
//                      "TEMPERATURE":      {"nbytes": 2, "type": "Int", "div": 10},
//                      "HUMIDITY":         {"nbytes": 2, "type": "Int", "div": 10},
//                      "CO2":              {"nbytes": 2, "type": "Int", "div": 10},
//                      "GPS_LATITUDE":     {"nbytes": 4, "type": "Int", "div": 100000},
//                      "GPS_LONGITUDE":    {"nbytes": 4, "type": "Int", "div": 100000},
//                      "BATTERY":          {"nbytes": 0, "type": "Flag", "nbits": 7, "initpos": 2, "div": 1},
//                      "SOURCE" :          {"nbytes": 1, "type": "Flag", "nbits": 1, "initpos": 1, "div": 1}
//                      }'
// BYTES_FRAME =  'true' ('false' si la trama ya viene en JSON o 'true' si es una trama de bytes a decodificar)
// LITTLE_ENDIAN = 'false' (formato de los bytes en caso de trama de bytes, 'false' para LE 'true' para BE)

// ------------IMPORTACIONES---------------
// colors para colorear logs
const Colors = require('colors');
// Importamos modulo 
const net = require('net');
// Importamos función de conexión a la bd
const { dbConnect, storeDb } = require('./database/dbFunctions.js');

// Importar config para variables de entorno con dotenv (solo para desarrollo)
require('dotenv').config();


// ==============Config auxiliar para comprobaciones con variables de entorno==========
// Estructura de datos configurada.
const dataStructure = JSON.parse(process.env.DATA_STRUCTURE);
// console.log(dataStructure);

// longitud de trama esperada en caso de trama de bytes
let struc_length = 0;
for (const property in dataStructure) {
    struc_length += dataStructure[property].nbytes;
}

const LE = (process.env.LITTLE_ENDIAN == 'true') ? true : false;
//======================================================================================

// Configuración ===================================
const port = process.env.PORT;
//=================================================

// Creación de una instancia del servidor y asociación del callback de resolución de clientes
const server = net.createServer(onClientConnection);

// Start listening on given port and host.
server.listen(port, function() {
    console.log(`Server started on port ${port}`.brightGreen);
});

// Conexión a la base de datos
const conectarDB = async() => {

    await dbConnect();
}
conectarDB();

// Callback de resolución de clientes
function onClientConnection(socket) {

    // Cliente conectado
    console.log(`${socket.remoteAddress}:${socket.remotePort} Connected`.brightYellow);

    // Resolver los datos del cliente
    socket.on('data', function(raw_data) {

        let serverResp = '';
        let object_data;

        //-----------------------Si la trama está configurada en bytes (Buffer)------------------------------
        // la decodificamos a un Objeto con la estructura esperada
        if (process.env.BYTES_FRAME == 'true') {

            console.log(`>> buffer de bytes recibido :`.brightCyan);
            console.log(raw_data);

            //comprobamos longitud de la trama recibida con la esperada (en este caso no se puede comprobar estructura)
            if (struc_length == raw_data.length) {

                serverResp = `trama de ${struc_length} bytes recibida, decodificando...`.green
                console.log(serverResp);

                // decodificamos trama a un objeto con la estructura esperada
                object_data = decodeFrame(raw_data);

                serverResp = `>> json decodificado : ${JSON.stringify(object_data)} `.brightCyan
                console.log(serverResp);
                serverResp = "guardando en BD...".green
                console.log(serverResp);
                socket.write(serverResp);
                // guardamos en db
                tryStoreDB(socket, object_data) //////////////////////////////descomentar


            } else {
                serverResp = `La trama recibida no es de ${struc_length} bits`.red
                console.log(serverResp);
                socket.write(serverResp);
            }

            //-------------------------Si la trama está configurada en JSON-------------------------------------
        } else {

            console.log(`>> json recibido : ${raw_data} `.brightCyan);

            // parseamos a objeto
            object_data = JSON.parse(raw_data);

            // comprobamos estructura recibida con la esperada
            if (checkStructure(object_data)) {

                serverResp = "Estructura de datos correcta, guardando en BD...".green
                console.log(serverResp);
                socket.write(serverResp);

                tryStoreDB(socket, object_data)


            } else {
                serverResp = `Los datos deben tener la estructura ${process.env.DATA_STRUCTURE}`.red
                console.log(serverResp);
                socket.write(serverResp);
            }

        }

        // Cerrar conexión 
        socket.end()
    });


    // Resolver cierre de conexión por parte del cliente
    socket.on('close', function() {
        console.log(`${socket.remoteAddress}:${socket.remotePort} Connection closed`.gray);
    });


    // Reslover errores del cliente
    socket.on('error', function(error) {
        console.error(`${socket.remoteAddress}:${socket.remotePort} Connection Error ${error}`.red);
    });

};

const tryStoreDB = (socket, dbdata) => {

    try {
        let resp = storeDb(dbdata);
        console.log(`${resp}`.green);
        socket.write(`${resp}`.green);
    } catch (error) {
        console.log(`${error}`.bgRed);
        socket.write(`${error}`.bgRed);
    }

}

//TODO cambiar estructura de la tabla de la bd para las medidas del OBU reales
const checkStructure = (data) => {

    //console.log(dataStructure);

    for (const property in dataStructure) {
        //console.log(`${property}: ${dataStructure[property]}`);
        if (!data[property]) return false
    }
    return true;

}

const decodeFrame = (bytes_data) => {

    //crear mapa de datos validos obtenidos del VALID_DATA
    let valid_map = new Object();

    for (const property in dataStructure) {
        let pos_VD = 0;
        if (property == "VALID_DATA") {

            const binfo = dataStructure[property] //El contenido de VALID_DATA
            const decoded_VD = decode_next(bytes_data, pos_VD, binfo)

            for (i = 0; i < (binfo.nbytes * 8); i++) {

                const be = bitExtracted(decoded_VD, 1, i + 1);
                // console.log(binfo.map[i]);
                binfo.map[i].forEach(prop => {
                    valid_map[prop] = !be; //las propiedades validas están a 0, inválidas a 1
                });
            }

            break; //al encontrar VALID_DATA dejamos de recorrer

        } else {
            pos_VD++
        }
    }
    // console.log(valid_map);
    // Log de TEST del mapeo
    for (const prop in valid_map) {
        if (!valid_map[prop]) { console.log(prop + ' es válido'.green) } else { console.log(prop + ' no es válido'.red); }
    }

    ////////////////////////////

    let bytes_count = 0;
    let object_data = new Object();

    for (const property in dataStructure) {

        if (valid_map[property]) {

            object_data[property] = null

        } else {
            //console.log(`${property}: ${dataStructure[property]}`);
            object_data[property] = decode_next(bytes_data, bytes_count, dataStructure[property]);

        }

        bytes_count += dataStructure[property].nbytes;

    }

    return object_data;
}

const decode_next = (buffer, bcount, binfo) => {

    let resp;

    //console.log(buffer[bcount]);
    // console.log(bitExtracted(object_data.SOURCE, 5, 2));
    //let extraction = buffer.readInt8(31)
    //console.log(extraction);
    //console.log(bitExtracted(buffer[bcount], 5, 1));


    switch (binfo.type) {
        case "Validation":
            resp = (LE) ? buffer.readIntLE(bcount, binfo.nbytes) / binfo.div : buffer.readIntBE(bcount, binfo.nbytes) / binfo.div
            return resp;
        case "Int":
            resp = (LE) ? buffer.readIntLE(bcount, binfo.nbytes) / binfo.div : buffer.readIntBE(bcount, binfo.nbytes) / binfo.div
            return resp;
        case "Float":
            resp = (LE) ? buffer.readFloatLE(bcount) / binfo.div : buffer.readFloatBE(bcount) / binfo.div
            return resp;
        case "Double":
            resp = (LE) ? buffer.readDoubleLE(bcount) / binfo.div : buffer.readDoubleBE(bcount) / binfo.div
            return resp;
        case "BigInt64":
            resp = (LE) ? buffer.readBigInt64LE(bcount) / BigInt(binfo.div) : buffer.readBigInt64BE(bcount) / BigInt(binfo.div)
            return resp;
        case "UInt":
            resp = (LE) ? buffer.readUintLE(bcount, binfo.nbytes) / binfo.div : buffer.readUintBE(bcount, binfo.nbytes) / binfo.div
            return resp;
        case "BigUInt64":
            resp = (LE) ? buffer.readBigUInt64LE(bcount) / binfo.div : buffer.readBigUInt64BE(bcount) / binfo.div
            return resp;
        case "Flag":
            resp = bitExtracted(buffer[bcount], binfo.nbits, binfo.initpos) / binfo.div
            return resp;
        default:
            break;
    }

}

// Función que extrae 'k' bits desde una posición 'p'(de menos significativo a más) en un número
// Usada para decodificar bits 'sueltos'
function bitExtracted(number, k, p) {
    return (((1 << k) - 1) & (number >> (p - 1)));
}