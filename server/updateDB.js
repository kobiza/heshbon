const fs = require('fs');
const xlsx = require('node-xlsx');
const DB = require('./DB')

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

const getFileData = (fileFullPath) => {
    const transactions = xlsx.parse(fileFullPath)[0].data;
    const cardsRowsIndex = findIndexes(transactions, (row) => row[1] && row[1] === 'מועד חיוב')
    const cardsRanges = indexesToRanges(transactions, cardsRowsIndex)

    const isDirtyInIsrael = item =>  {
        const [date] = item

        return !date
    }

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

    const isDirtyOutOfIsrael = item =>  {
        const [date, date2] = item

        return !date2
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

    const cardsData = {}

    cardsRowsIndex.forEach((rowIndex, cardIndex) => {
        const title = transactions[rowIndex][0]
        const last4Digits = title.slice(-4)
        const date = transactions[rowIndex][2]
        const cardRange = cardsRanges[cardIndex]
        const allCardRecords = transactions.slice(cardRange[0], cardRange[1] + 1)
        const inOutILIndexes = findIndexes(allCardRecords, (row) => row[0] && (row[0] === 'עסקאות בארץ' || row[0] === 'עסקאות בחו˝ל'))
        const [inILRange, outOfILRange] = indexesToRanges(allCardRecords, inOutILIndexes)
        const inIsraelRecords = inILRange ? allCardRecords.slice(inILRange[0], inILRange[1] + 1) : []
        const outOfIsraelRecords = outOfILRange ? allCardRecords.slice(outOfILRange[0], outOfILRange[1] + 1) : []
        const inIsraelRows = inIsraelRecords.slice(2, -1).filter(r => !isDirtyInIsrael(r)).map(getILRowData)
        const outOfIsraelRows = outOfIsraelRecords.slice(2).filter(r => !isDirtyOutOfIsrael(r)).map(getOutOfILRowData)
        const rows = inIsraelRows.concat(outOfIsraelRows)

        const key = `${last4Digits}__${date.replace(/\//g, "_")}`
        Object.assign(cardsData, {
            [key]: {
                title,
                date,
                rows
            }
        })
    })

    return cardsData
}

const updateDataFromFiles = (folderName) => {
    const folderPath = `${__dirname}/${folderName}`
    const dataToAdd = {}

    fs.readdir(folderPath, (err, files) => {
        files.forEach(fileName => {
            const fileFullPath = `${folderPath}/${fileName}`
            const fileData = getFileData(fileFullPath)

            // console.log(JSON.stringify(fileData))
            Object.assign(dataToAdd, fileData)
        });

        DB.setIn('/transactions/', dataToAdd)
    });
}

const updateTransactionsAdditionalData = (additionalDataTitle) => (cardKey, index, data ) => {
    DB.setIn(`/additionalData/${cardKey}/rows/${index}/${additionalDataTitle}/`, data)
}

// const updateRecordTags = updateTransactionsAdditionalData('tags')
// const updateRecordStatus = updateTransactionsAdditionalData('status')

// updateRecordTags('2270__02_04_20', 0, {
//     'קבוע': 'קבוע',
//     'חשמל': 'חשמל',
// })
//
// updateRecordStatus('2270__02_04_20', 0, 'checked')
updateDataFromFiles('files_to_read')


