const { initializeApp, cert } = require("firebase-admin/app")
const { getFirestore, Timestamp } = require("firebase-admin/firestore")

initializeApp({
    credential: cert(require("../creds/firebase.json"))
})

const database = getFirestore();

module.exports = async function (context, req) {

    let limit = 0;
    req.body?.limit && typeof(limit) == "number" && req.body.limit > 0 && (limit = req.body.limit);

    const snapshot = await database.collection("events").orderBy("timestamp").get();
    let docs = snapshot.docs;
    let index = docs.length;
    for (const [i, doc] of docs.entries()) {
        if (doc.data()["timestamp"] > Timestamp.now()) {
            index = i;
            break;
        }
    }

    let old = docs.slice(0, index).map(doc => {
        let date = new Date(doc.data()["timestamp"].seconds * 1000);
        let data = doc.data();
        return {
            date: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            hour: date.getHours(),
            minutes: date.getMinutes(),
            venue: data.venue,
            name: data.name,
            image: data.image,
            description: data.description
        }
    })

    let upcoming = docs.slice(index).map(doc => {
        let date = new Date(doc.data()["timestamp"].seconds * 1000);
        let data = doc.data();
        return {
            date: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            hour: date.getHours(),
            minutes: date.getMinutes(),
            venue: data.venue,
            name: data.name,
            image: data.image,
            description: data.description
        }
    })
    
    if (limit) {
        old = old.slice(-limit)
        upcoming = upcoming.slice(0, limit)
    }
    
    context.res.status(200);
    context.res.send({
        old, upcoming
    })
}