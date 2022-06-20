module.exports = class ProyeccionLP {
    constructor (
        cripto,
        fecha,
        idPrecio,
        forecast,
        pesimista,
        optimista,
        idGrupo
    ) {
        this.cripto = cripto;
        this.fecha = fecha;
        this.idPrecio = idPrecio;
        this.forecast = forecast;
        this.pesimista = pesimista;
        this.optimista = optimista;
        this.idGrupo = idGrupo
    }
    push(proyeccionescp) {
        proyeccionescp.push({
            cripto: this.cripto,
            fecha: this.fecha,
            id_precio: this.idPrecio,
            forecast: this.forecast,
            pesimista: this.pesimista,
            optimista: this.optimista,
            id_grupo: this.idGrupo
        });
    }
}