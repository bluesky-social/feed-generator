import * as whatsAlf from './whats-alf';
import * as osr from './osr';

const algos = {
  [whatsAlf.shortname]: whatsAlf.handler,
  [osr.shortname]: osr.handler,
};

export default algos;
