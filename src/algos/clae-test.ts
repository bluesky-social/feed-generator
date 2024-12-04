import { AlgoBase } from "./algo-base"

export class ClaeTestAlgo extends AlgoBase {

  includedAuthors = ["did:plc:wc2nljklaywqr4axivpddo4i"]
  excludedAuthors = []
  includedKeywords = ["test"];
  excludedKeywords = [];

  constructor(feed:number) {
    super(feed)
    this.shortname = "clae-test"
  }
  
}
