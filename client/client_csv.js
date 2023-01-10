// Importamos modulo 
const net = require('net');
const fs = require('fs');
const parser = require('csv-parser');



// ================ CONFIGURATION PARAMS ===================================
// -- PORT --
// const port = 8888;
const port = 30000; // ESTE ES EL PUERTO DEL SERVICIO NODEPORT EN EL QUE ESTÁ EL POD DEL SERVER, PARA RECIBIR TRAMAS
// const port = 10002;

// -- IP SERVER -- (Sustituir por la ip local o pública de la raspi)
// const server_URL = "127.0.0.1"
// const server_URL = "raspberrypi.local"
const server_URL = "158.42.89.254" // ESTA ES LA IP DE LA RASPI EN LA RED LOCAL
    // const server_URL = "192.168.10.244"
    // const server_URL = "e110eldi.upct.es"

// Al final las tramas deben de recibirse en la ip de la raspberry, en el puerto 30000

// ================ frames send config ======================
const interval = 5000 //milisegundos entre envíos
const mode = 3 // 1 -> una sola trama (manual), 2 -> tramas en CSV (frames.csv), 3 -> tramas aleatorias en bucle

// =====================================================================




// ----------------- Client 1 -----------------------
// Creación socket cliente
const client1 = new net.Socket();

let data = [];

if (mode == 1) { // envía una sola trama con los valores del objeto siguiente

    // JSON FRAME
    data = {
            VALID_DATA: 127, //Especifica en binario los campos que serán válidos a 1 (PM, CO, NO2, SO2, O3, TEMP/HUM, CO2, GPS)
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
            SOURCE: 1 //solo válido 0 (OBU exterior) ó 1 (OBU interior)
        }
        //console.log(data);
    sendFrame(data);

} else if (mode == 2) { // envía tantas tramas como líneas encuentre en el archivo 'frames.csv', que debe estar en la misma carpeta

    fs.createReadStream('frames.csv')
        .pipe(
            parser({
                mapValues: ({ value }) => Number(value)
            })
        )
        .on('data', row => data.push(row))
        .on('end', () => {
            //console.log(data); //////
            sendFrames(data)
        })

} else { // envía tramas con valores aleatorios (coherentes) indefinidamente

    randomFrame()

}

// --------- Aux timer ------------
function wait(milleseconds) {
    return new Promise(resolve => setTimeout(resolve, milleseconds))
}

// --------- Send array of frames -------
async function sendFrames(frames) {
    let first = true;
    for (frame of frames) {
        if (!first) {
            await wait(interval)
        } else {
            first = false
        }
        sendFrame(frame)
    }
}

// --------- send random frames indefinitely --------------
async function randomFrame() {
    let first = true;
    while (true) {
        data = {
            VALID_DATA: 255, //Especifica en binario los campos que serán válidos a 1 (PM, CO, NO2, SO2, O3, TEMP/HUM, CO2, GPS)
            PARTICLES_1: between(100, 500) / 10, // 10.0-50.0
            PARTICLES_2_5: between(1000, 5000) / 10, // 100.0-500.0
            PARTICLES_4: between(500, 1000) / 10, // 50.0-100.0
            PARTICLES_10: between(600, 1500) / 10, // 60.0-150.0
            GASES_CO: between(200, 1200) / 10, // 20.0-120.0
            GASES_NO2: between(4000, 15000) / 10, // 400.0-1500.0
            GASES_SO2: between(7000, 20000) / 10, // 700.0-2000.0
            GASES_O3: between(3000, 12000) / 10, // 300.0-1200.0
            TEMPERATURE: between(150, 350) / 10, // 15.0-35.0
            HUMIDITY: between(100, 950) / 10, // 10.0-95.0
            CO2: between(4000, 15000) / 10, // 400.0-1500.0
            GPS_LATITUDE: between(3758159, 3762470) / 100000,
            GPS_LONGITUDE: between(-101331, -095312) / 100000,
            BATTERY: between(10, 99), // 10-99%
            SOURCE: between(0, 1) //solo válido 0 (OBU exterior) ó 1 (OBU interior)
        }

        //console.log(data);

        if (!first) {
            await wait(interval)
        } else {
            first = false
        }
        sendFrame(data)
    }
}

function between(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1) + min
    )
}


// Connection to Server with configured port and IP
function sendFrame(dataFrame) {
    client1.connect(port, server_URL, function() {
        //Connection established
        console.log(`Client 1 :Connected to server on port ${port}`);

        // BYTES FRAME

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
        new DataView(Abuffer).setInt8(0, dataFrame.VALID_DATA, false) //VALID_DATA
        new DataView(Abuffer).setInt16(1, dataFrame.PARTICLES_1 * 10, false)
        new DataView(Abuffer).setInt16(3, dataFrame.PARTICLES_2_5 * 10, false)
        new DataView(Abuffer).setInt16(5, dataFrame.PARTICLES_4 * 10, false)
        new DataView(Abuffer).setInt16(7, dataFrame.PARTICLES_10 * 10, false)
        new DataView(Abuffer).setInt16(9, dataFrame.GASES_CO * 10, false)
        new DataView(Abuffer).setInt16(11, dataFrame.GASES_NO2 * 10, false)
        new DataView(Abuffer).setInt16(13, dataFrame.GASES_SO2 * 10, false)
        new DataView(Abuffer).setInt16(15, dataFrame.GASES_O3 * 10, false)
        new DataView(Abuffer).setInt16(17, dataFrame.TEMPERATURE * 10, false)
        new DataView(Abuffer).setInt16(19, dataFrame.HUMIDITY * 10, false)
        new DataView(Abuffer).setInt16(21, dataFrame.CO2 * 10, false)
        new DataView(Abuffer).setInt32(23, dataFrame.GPS_LATITUDE * 100000, false)
        new DataView(Abuffer).setInt32(27, dataFrame.GPS_LONGITUDE * 100000, false)
        new DataView(Abuffer).setInt8(31, concatBit(dataFrame.BATTERY, dataFrame.SOURCE), false) //0 para OBU interna, 1 para exterior

        let buf = Buffer.from(Abuffer);

        console.log(Abuffer);
        //console.log(buf);

        console.log(dataFrame);

        //----------------COMENTAR/DESCOMENTAR SEGÚN SE MANDE json o buffer de bytes---------------
        // (CAMBIAR TAMBIÉN VARIABLE DE ENTORNO CORRESPONDIENTE EN EL SERVER)
        //client1.write(json_datos); //////////
        client1.write(buf);
        //-----------------------------------------------------------------------------------------

    });
}




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