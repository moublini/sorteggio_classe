type Studente = number;
interface Classe {
  numeroStudenti: number,
  esclusi?: Studente[],
  inclusi?: Studente[]
}

class SorteggioClasse {
  private _classeScelta: Classe;
  static classiSalvate: Record<string, Classe> = {
    "3B": {
      numeroStudenti: 26,
      esclusi: [ 3, 4, 7, 8, 10, 21, 23 ],
      inclusi: [ 1, 2, 9, 17, 22 ]
    }
  }

  /**
   * 
   * ```ts
   * // 3D è presente in classiSalvate, quindi utilizzerà quell'oggetto e non ne creerà uno nuovo.
   * const classe3D = new SorteggioClasse("3D");
   * 
   * //Equivalente dell'espressione precedente.
   * const classe3D = new SorteggioClasse("3D", 10);
   * 
   * // "3D" Non esiste in classiSalvate. Tenterà di creare un nuovo oggetto ma siccome il numero di studenti è ignoto, restituisce un errore.
   * const classe3D = new SorteggioClasse("3D");
   * 
   * // "3D" Non esiste in classiSalvate. Questo crea un nuovo oggeto dove numeroStudenti = 26, ma inclusi e esclusi sono nulli.
   * const classe3D = new SorteggioClasse("3D", 26);
```
   * @param classe La classe da scegliere
   * @param numeroStudenti Quanti studenti possiede la classe (se assente in classiSalvate)
   */
  constructor(classe: string, numeroStudenti = 0) {
    classe = classe.toLowerCase();

    const classiSalvate: typeof SorteggioClasse.classiSalvate = {};
    for (let [ key, value ] of Object.entries(SorteggioClasse.classiSalvate)) {
      key = key.toLowerCase();
      classiSalvate[ key ] = value;

      if (classe === key)
        this._classeScelta = classiSalvate[ key ];
    }


    if (!this._classeScelta && numeroStudenti <= 0)
      this.segnalaClasseInvalida(classe);

    if (!this._classeScelta)
      this._classeScelta = classiSalvate[ classe ] = { numeroStudenti: numeroStudenti! }

    SorteggioClasse.classiSalvate = classiSalvate;
  }

  get classeScelta() {
    return { ...this.classeScelta };
  }

  /**
   * Fa un sorteggio di tutti gli alunni senza alcun filtro speciale.
   * ```ts
   * const classe3B = new SorteggioClasse("<classe>"); // 3B esiste e possiede 26 studenti.
   * classe3B.sorteggioUniversale(10); // [1, 2, ... , 10] (Facendo finta sia a caso)
   * ```
   * @param quantita Quanti studenti sorteggiare
   * @returns Gli studenti sorteggiati
   */
  sorteggioUniversale(quantita: number): Studente[] {
    let { numeroStudenti } = this._classeScelta;
    let arraySorteggio = this.preparaSorteggio([], numeroStudenti);
    return this.sorteggio(arraySorteggio, numeroStudenti, quantita);
  }

  /**
   * Fa un sorteggio di tutti gli alunni con indice pari.
   * ```ts
   * const classe3B = new SorteggioClasse("<classe>"); // 3B esiste e possiede 26 studenti.
   * classe3B.sorteggioPari(10); // [2, 4, ... , 20] (Facendo finta sia a caso)
   * ```
   * @param quantita Quanti studenti sorteggiare
   * @returns Gli studenti sorteggiati
   */
  sorteggioPari(quantita: number): Studente[] {
    let { numeroStudenti } = this._classeScelta;
    let arraySorteggio = this.preparaSorteggio([], numeroStudenti).filter((_, index) => index % 2 === 1);
    return this.sorteggio(arraySorteggio, numeroStudenti, quantita);
  }

  /**
   * Fa un sorteggio di tutti gli alunni con indice dispari.
   * ```ts
   * const classe3B = new SorteggioClasse("<classe>"); // 3B esiste e possiede 26 studenti.
   * classe3B.sorteggioDispari(10); // [1, 3, ... , 19] (Facendo finta sia a caso)
   * ```
   * @param quantita Quanti studenti sorteggiare
   * @returns Gli studenti sorteggiati
   */
  sorteggioDispari(quantita: number): Studente[] {
    let { numeroStudenti } = this._classeScelta;
    let arraySorteggio = this.preparaSorteggio([], numeroStudenti).filter((_, index) => index % 2 === 0);
    return this.sorteggio(arraySorteggio, numeroStudenti, quantita);
  }

  /**
   * Fa un sorteggio di tutti gli alunni della lista inclusi.
   * ```ts
   * const classe3B = new SorteggioClasse("<classe>"); // 3B esiste e possiede 26 studenti, gli inclusi sono [1, 2, 9, 17, 22].
   * classe3B.sorteggioInclusi(10); // [1, 2, 9, 17, 22] (quantità è maggiore di 5, la lunghezza degli inclusi)
   * classe3B.sorteggioInclusi(3); // [2, 9, 22] (quantità è minore di 5, la lunghezza degli inclusi)
   * ```
   * @param quantita Quanti studenti sorteggiare
   * @returns Gli studenti sorteggiati
   */
  sorteggioInclusi(quantita: number): Studente[] {
    let { inclusi } = this._classeScelta;
    if (!inclusi)
      throw new Error("Non puoi eseguire sorteggioInclusi() senza aver definito una lista di persone incluse!")

    let arraySorteggio = this.preparaSorteggio(inclusi, quantita);
    return this.sorteggio(arraySorteggio, inclusi.length, quantita);
  }

  /**
   * Fa un sorteggio di tutti gli alunni eccetto quelli presenti nella lista esclusi.
   * ```ts
   * const classe3B = new SorteggioClasse("<classe>"); // 3B esiste e possiede 26 studenti, gli esclusi sono 7: [ 3, 4, 7, 8, 10, 21, 23 ].
   * classe3B.sorteggioInclusi(5); // [1, 2, 5, 6, 9] (Facendo finta sia a caso)
   * classe3B.sorteggioInclusi(26); // [1, 2, 5, 6, 9, 11, 12, ...] (restituisce tutti gli alunni eccetto i 7 esclusi)
   * ```
   * @param quantita Quanti studenti sorteggiare
   * @returns Gli studenti sorteggiati
   */
  sorteggioEsclusi(quantita: number): Studente[] {
    let { esclusi, numeroStudenti } = this._classeScelta;
    if (!esclusi)
      throw new Error("Non puoi eseguire sorteggioEsclusi() senza aver definito una lista di persone escluse!")

    let arraySorteggio = this.preparaSorteggio([], numeroStudenti).filter(studente => !esclusi!.includes(studente));
    return this.sorteggio(arraySorteggio, numeroStudenti - esclusi.length, quantita);
  }

  // Funzioni private, garantiscono il funzionamento del codice.

  private preparaSorteggio(array: Studente[], quantita: number): typeof array {
    if (quantita < array.length)
      return array

    let preparazione: typeof array = [];
    for (let i = 0; i < Math.max(array.length, quantita); i++) {
      if (array.length === 0) preparazione.push(i + 1);
      else if (array[ i ]) preparazione.push(array[ i ])
    }

    return preparazione;
  }

  private sorteggio(array: Studente[], limiteArray: number, quantita: number): typeof array {
    if (array.length < quantita) {
      array = array.slice(0, limiteArray).sort((prev, curr) => prev - curr);
      return this.stampaSfigatiSorteggiati(array);
    }

    let sorteggiati: typeof array = [];
    while (sorteggiati.length < quantita) {
      const indexCasuale = Math.floor(Math.random() * array.length);
      let studenteScelto = array[ indexCasuale ];

      if (!sorteggiati.includes(studenteScelto))
        sorteggiati.push(studenteScelto);
    }

    sorteggiati = sorteggiati.sort((prev, curr) => prev - curr);
    return this.stampaSfigatiSorteggiati(sorteggiati);
  }

  private stampaSfigatiSorteggiati(studenti: Studente[]): typeof studenti {
    if (studenti.length <= 0) {
      console.log("Nessuno è stato sorteggiato...");
      return [];
    }

    console.log(`I ${studenti.length} sfigati sorteggiati sono...`);
    for (let [ index, studente ] of studenti.entries()) {
      console.log(`Numero ${index + 1}: ${studente}!`);
    }
    console.log();
    return studenti;
  }

  private segnalaClasseInvalida(classe?: string) {
    throw new Error(`Errore! La classe che hai scelto non esiste, tuttavia se la aggiungi alla lista classiSalvate o passi il parametro numerico studenti (> 0) potrai crearne una nuova.
      \nEsempio 1: static classiSalvate: Record<string, Classe> = {
      ...
      "${classe}: {
        numeroStudenti: 26,
        esclusi: [ 10, 4, 21, 23, 3, 7, 8 ],
        inclusi: [ 1, 2, 9, 22 ]
      },"
      \nEsempio 2: new SorteggioClasse("${classe || '3D'}", 26);\n`.trim());
  }
}