module.exports = class RentabilidadLP {
    constructor (
        secuencial,
        escenario,
        cripto,
        d30,
        m3,
        m6,
        a1,
        /* a2,
        a5 */
        idGrupo
    ) {
        this.secuencial = secuencial;
        this.escenario = escenario;
        this.cripto = cripto;
        this.d30 = d30;
        this.m3 = m3;
        this.m6 = m6;
        this.a1 = a1;
        /* this.a2 = a2;
        this.a5 = a5; */
        this.idGrupo = idGrupo
    }
    push(proyeccionescp) {
        proyeccionescp.push({
            secuencial: this.secuencial,
            escenario: this.escenario,
            cripto: this.cripto,
            d30: this.d30,
            m3: this.m3,
            m6: this.m6,
            a1: this.a1,
            /* a2: this.a2,
            a5: this.a5, */
            id_grupo: this.idGrupo
        });
    }
}