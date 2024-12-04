import { AlgoBase } from "./algo-base"

export class ClaeAnadenArtAlgo extends AlgoBase {

  includedAuthors = ["did:plc:wc2nljklaywqr4axivpddo4i"]
  excludedAuthors = []
  includedKeywords = [
    "#anothereden", "anothereden", "#アナザーエデン", "アナザーエデン", "#アナザー絵デン"
  ];
  excludedKeywords = ["clae_ae", "#clae_ae"];

  constructor(feed:number) {
    super(feed)
    this.shortname = "clae-andn"
  }
  
}
