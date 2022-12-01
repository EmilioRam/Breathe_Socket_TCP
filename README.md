# Breathe_Socket_TCP
Server con Socket TCP Universal, para recibir tramas con estructura configurable  guardarlas en una BD MaríaDB/MySQL, tanto en trama de bytes codificada, como en JSON

// Las variables de entorno que debemos configurar son:

// PORT = Puerto configurado para escuchar
// HOST_DB = 'url de la BD MySQL'
// USER_DB = 'Usuario'
// PASS_DB = 'pass'
// DATABASE = 'Nombre de la DB'
// TABLENAME = 'nombre de la tabla'
// // La codificación de la estructura es KEY: {nro de bytes, tipo} (para caso trama de Bytes)
// // (donde se especifica el nro de bytes y el tipo de cada medida en la trama).
// // También se especifica un divisor por si hay un decimal que se transmite como entero y hay que dividirlo
// // para obtener el valor real.
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
