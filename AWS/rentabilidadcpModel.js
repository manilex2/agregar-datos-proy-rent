module.exports = class RentabilidadCP {
    constructor (
        secuencial,
        escenario,
        cripto,
        d15,
        d30,
        d45,
        /* d60,
        d90, */
        idGrupo
    ) {
        this.secuencial = secuencial;
        this.escenario = escenario;
        this.cripto = cripto;
        this.d15 = d15;
        this.d30 = d30;
        this.d45 = d45;
        /* this.d60 = d60;
        this.d90 = d90; */
        this.idGrupo = idGrupo
    }
    push(proyeccionescp) {
        proyeccionescp.push({
            secuencial: this.secuencial,
            escenario: this.escenario,
            cripto: this.cripto,
            d15: this.d15,
            d30: this.d30,
            d45: this.d45,
            /* d60: this.d60,
            d90: this.d90, */
            id_grupo: this.idGrupo
        });
    }
}