// const readXlsxFile = require('read-excel-file/node');
//
// var filename = 'MyMoneyCorporationList.xlsx';
// var fullPath = __dirname + "/files/" + filename;
//
// // var fullPath = 'MyMoneyCorporationList.xlsx'
//
//
// // File path.
// readXlsxFile(fullPath).then((rows) => {
//     console.log('rows', rows)
// })

const xlsx = require('node-xlsx');

const filename = 'Export_6_2020 (1).xls';

// const fullPath = __dirname + "/files_to_read/" + filename;

const fs = require('fs');

const getFileData = (fileFullPath) => {
    const transactions = xlsx.parse(fileFullPath)[0].data;
    const cardsRowsIndex = findIndexes(transactions, (row) => row[1] && row[1] === 'מועד חיוב')
    const cardsRanges = indexesToRanges(transactions, cardsRowsIndex)

    const getILRowData = (item) => {
        const [date, name, x, y, amount, z, voucherNumber] = item

        return {
            date,
            name,
            amount,
            voucherNumber,
            isInIsrael: true
        }
    }

    const isDirty = item =>  {
        return item[2] === 'TOTAL FOR DATE'
    }

    const getOutOfILRowData = (item) => {
        const [date, x, name, y, z, amount] = item

        return {
            date,
            name,
            amount,
            voucherNumber: '',
            isInIsrael: false
        }
    }

    return cardsRowsIndex.map((rowIndex, cardIndex) => {
        const title = transactions[rowIndex][0]
        const last4Digits = title.slice(-4)
        const date = transactions[rowIndex][2]
        const cardRange = cardsRanges[cardIndex]
        const allCardRecords = transactions.slice(cardRange[0], cardRange[1] + 1)
        const inOutILIndexes = findIndexes(allCardRecords, (row) => row[0] && (row[0] === 'עסקאות בארץ' || row[0] === 'עסקאות בחו˝ל'))
        const [inILRange, outOfILRange] = indexesToRanges(allCardRecords, inOutILIndexes)
        const inIsraelRecords = inILRange ? allCardRecords.slice(inILRange[0], inILRange[1] + 1) : []
        const outOfIsraelRecords = outOfILRange ? allCardRecords.slice(outOfILRange[0], outOfILRange[1] + 1) : []
        const inIsraelRows = inIsraelRecords.slice(2, -1).map(getILRowData)
        const outOfIsraelRows = outOfIsraelRecords.slice(2).filter(r => !isDirty(r)).map(getOutOfILRowData)
        const rows = inIsraelRows.concat(outOfIsraelRows)

        return {
            [`${last4Digits}__${date}`]: {
                title,
                date,
                rows
            }
        }
    })
}

const getAllDataFromFiles = (folderName) => {
    const folderPath = `${__dirname}/${folderName}`

    fs.readdir(folderPath, (err, files) => {
        files.forEach(fileName => {
            const fileFullPath = `${folderPath}/${fileName}`;
            const fileData = getFileData(fileFullPath)
            console.log(fileFullPath, JSON.stringify(fileData));
        });
    });
}


getAllDataFromFiles('files_to_read')


const findIndexes = (arr, prediate) => {
    const indexes = []
    for (let i = 0; i < arr.length; i++) {
        if (prediate(arr[i], i)) {
            indexes.push(i)
        }
    }

    return indexes
}

const indexesToRanges = (arr, indexes) => {
    const checkpoints = [...indexes, arr.length]

    const ranges = []
    for (let i = 1; i < checkpoints.length; i++) {
        ranges.push([checkpoints[i - 1], checkpoints[i] - 1])
    }

    return ranges
}

