// Importamos modulo 
const net = require('net');

// Configuración ===================================
// const port = 8888;
const port = 30000;
//=================================================

//================= Client 1 ==========================
// Creación socket cliente
const client1 = new net.Socket();

// const server_URL = "127.0.0.1"
const server_URL = "raspberrypi.local"

// Conexión al server en el puerto configurado
client1.connect(port, server_URL, function() {
    //Conexión establecida
    console.log(`Client 1 :Connected to server on port ${port}`);

    //Envío de datos al cliente 

    // let obj_datos = {
    //     co: 23,
    //     no: 34,
    //     so: 26
    // }

    // TRAMA EN JSON
    let obj_datos = {
        VALID_DATA: 127,
        PARTICLES_1: 35.7,
        PARTICLES_2_5: 158.5,
        PARTICLES_4: 69.8,
        PARTICLES_10: 78.4,
        GASES_CO: 45.8,
        GASES_NO2: 569.9,
        GASES_SO2: 1596.2,
        GASES_O3: 589.4,
        TEMPERATURE: 25.8,
        HUMIDITY: 67.7,
        CO2: 532.4,
        GPS_LATITUDE: 45.35894,
        GPS_LONGITUDE: 67.58472,
        BATTERY: 65, //%
        SOURCE: 1 //solo válido 0 ó 1
    }

    let json_datos = JSON.stringify(obj_datos);

    // TRAMA EN BYTES

    // Convertimos los datos a un buffer con la estructura:
    // { 
    // "VALID_DATA":       {"nbytes": 1, "type": "Int", "div": 1},
    // "PARTICLES_1":      {"nbytes": 2, "type": "Int", "div": 10},
    // "PARTICLES_2_5":    {"nbytes": 2, "type": "Int", "div": 10},
    // "PARTICLES_4":      {"nbytes": 2, "type": "Int", "div": 10},
    // "PARTICLES_10":     {"nbytes": 2, "type": "Int", "div": 10},
    // "GASES_CO":         {"nbytes": 2, "type": "Int", "div": 10},
    // "GASES_NO2":        {"nbytes": 2, "type": "Int", "div": 10},
    // "GASES_SO2":        {"nbytes": 2, "type": "Int", "div": 10},
    // "GASES_O3":         {"nbytes": 2, "type": "Int", "div": 10},
    // "TEMPERATURE":      {"nbytes": 2, "type": "Int", "div": 10},
    // "HUMIDITY":         {"nbytes": 2, "type": "Int", "div": 10},
    // "CO2":              {"nbytes": 2, "type": "Int", "div": 10},
    // "GPS_LATITUDE":     {"nbytes": 4, "type": "Int", "div": 100000},
    // "GPS_LONGITUDE":    {"nbytes": 4, "type": "Int", "div": 100000},
    // "BATTERY":          {"nbytes": 0, "type": "Flag", "nbits": 7, "initpos": 2, "div": 1},
    // "SOURCE" :          {"nbytes": 1, "type": "Flag", "nbits": 1, "initpos": 1, "div": 1}
    // }
    // DONDE SE ESPECIFICA EL NRO DE BYTES Y EL TIPO DE CADA MEDIDA EN LA TRAMA,
    // además de un divisor por si tenemos decimales "camuflados" habrá que dividir el entero por ese número
    // para obtener el valor real

    // En el método setIntxx el argumento booleano es true para Littleindian y false para Bigindian

    const Abuffer = new ArrayBuffer(32);
    new DataView(Abuffer).setInt8(0, obj_datos.VALID_DATA, false) //VALID_DATA
    new DataView(Abuffer).setInt16(1, obj_datos.PARTICLES_1 * 10, false)
    new DataView(Abuffer).setInt16(3, obj_datos.PARTICLES_2_5 * 10, false)
    new DataView(Abuffer).setInt16(5, obj_datos.PARTICLES_4 * 10, false)
    new DataView(Abuffer).setInt16(7, obj_datos.PARTICLES_10 * 10, false)
    new DataView(Abuffer).setInt16(9, obj_datos.GASES_CO * 10, false)
    new DataView(Abuffer).setInt16(11, obj_datos.GASES_NO2 * 10, false)
    new DataView(Abuffer).setInt16(13, obj_datos.GASES_SO2 * 10, false)
    new DataView(Abuffer).setInt16(15, obj_datos.GASES_O3 * 10, false)
    new DataView(Abuffer).setInt16(17, obj_datos.TEMPERATURE * 10, false)
    new DataView(Abuffer).setInt16(19, obj_datos.HUMIDITY * 10, false)
    new DataView(Abuffer).setInt16(21, obj_datos.CO2 * 10, false)
    new DataView(Abuffer).setInt32(23, obj_datos.GPS_LATITUDE * 100000, false)
    new DataView(Abuffer).setInt32(27, obj_datos.GPS_LONGITUDE * 100000, false)
    new DataView(Abuffer).setInt8(31, concatBit(obj_datos.BATTERY, obj_datos.SOURCE), false) //0 para OBU interna, 1 para exterior

    let buf = Buffer.from(Abuffer);

    console.log(Abuffer);
    //console.log(buf);

    // let buf = Buffer.from([0xFE, 0x74, 0x01]);

    //----------------COMENTAR/DESCOMENTAR SEGÚN SE MANDE json O buFFER DE BYTES---------------
    // (CAMBIAR TAMBIÉN VARIABLE DE ENTORNO CORRESPONDIENTE)
    //client1.write(json_datos); //////////
    client1.write(buf);
    //-----------------------------------------------------------------------------------------

    // let num = 21
    // if (num) console.log("si");
    // else { console.log("no"); }
    // console.log(bitExtracted(num, 1, 6));

});
// Resolver datos devueltos desde el servidor
client1.on('data', function(data) {
    console.log(`Client 1 received from server : ${data}`);
});
// Resolver cierre de la conexión 
client1.on('close', function() {
    console.log('Cleint 1 :Connection Closed');
});
// Resolver errores
client1.on('error', function(error) {
    console.error(`Connection Error ${error}`);
});

function bitExtracted(number, k, p) {
    return (((1 << k) - 1) & (number >> (p - 1)));
}

function concatBit(number, bit) {
    return ((number << 1) + bit);
}