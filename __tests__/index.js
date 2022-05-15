const path = require('path')
const { start } = require('../dist')

// const lockpath = '/Users/bibidu/Desktop/meituan/waimai_bargain_mp/yarn.lock'
const lockpath = path.resolve(__dirname, '..', 'yarn.lock')
start(lockpath)
