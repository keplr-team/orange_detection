import xml2js from 'xml2js';
import fs from 'fs';
import _ from 'lodash';

const LABELED_DIR = __dirname + '/dataset/resized'
const DATASET_DIR = __dirname + '/dataset'


const parser = new xml2js.Parser({ attrkey: "ATTR" });


async function run() {
    try {
        fs.mkdirSync(DATASET_DIR + '/images')
    } catch(e) {

    }
    const csvLabels = [
        'filename',
        'width',
        'height',
        'class',
        'xmin',
        'ymin',
        'xmax',
        'ymax',
        'source',
    ]
    const allCSV: string[][] = [];
    const dir = fs.readdirSync(LABELED_DIR)
    for(const file of dir) {
        if(file.match(/\.xml/)) {
            const xmlString = fs.readFileSync(LABELED_DIR + '/' + file)
            const data = await parser.parseStringPromise(xmlString)
            for(const object of data.annotation.object) {
                allCSV.push([
                    data.annotation.filename,
                    data.annotation.size[0].width,
                    data.annotation.size[0].height,
                    object.name,
                    object.bndbox[0].xmin,
                    object.bndbox[0].ymin,
                    object.bndbox[0].xmax,
                    object.bndbox[0].ymax,
                    'none'
                ])
            }
        } else if(file.match(/\.jpg/)) {
            fs.copyFileSync(LABELED_DIR + '/' + file, DATASET_DIR + '/images/' + file)
        }
    }
    const shuffled = _.shuffle(allCSV)
    const train = [csvLabels, ..._.take(shuffled, Math.floor(allCSV.length * 0.8))]
    const test = [csvLabels, ..._.takeRight(shuffled, Math.floor(allCSV.length * 0.2))]
    fs.writeFileSync(DATASET_DIR + '/train_labels.csv', train.map(t => t.join(',')).join('\n'))
    fs.writeFileSync(DATASET_DIR + '/test_labels.csv', test.map(t => t.join(',')).join('\n'))
    fs.copyFileSync(__dirname + '/labelmap.pbtxt', DATASET_DIR + '/labelmap.pbtxt')

}

run()