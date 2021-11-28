const { initializeApp, cert } = require("firebase-admin/app")
const { getFirestore, Timestamp } = require("firebase-admin/firestore")

initializeApp({
    credential: cert(require("../creds/firebase.json"))
})

const database = getFirestore();

module.exports = async function (context, req) {

    let limit = 0;
    req.body?.limit && typeof(limit) == "number" && req.body.limit > 0 && (limit = req.body.limit);

    const snapshot = await database.collection("events").orderBy("date-time").get();
    let docs = snapshot.docs;
    let index = docs.length;
    for (const [i, doc] of docs.entries()) {
        if (doc.data()["date-time"] > Timestamp.now()) {
            index = i;
            break;
        }
    }

    let old = docs.slice(0, index).map(doc => [doc.id, {
        venue: doc.data().venue,
        date: new Date(doc.data()["date-time"]._seconds * 1000).getDate(),
        month: new Date(doc.data()["date-time"]._seconds * 1000).getMonth(),
        year: new Date(doc.data()["date-time"]._seconds * 1000).getFullYear(),
        hour: new Date(doc.data()["date-time"]._seconds * 1000).getHours(),
        minutes: new Date(doc.data()["date-time"]._seconds * 1000).getMinutes(),
        name: doc.data().name,
        image: doc.data().image
    }]);
    
    let upcoming = docs.slice(index).map(doc => [doc.id, {
        venue: doc.data().venue,
        date: new Date(doc.data()["date-time"]._seconds * 1000).getDate(),
        month: new Date(doc.data()["date-time"]._seconds * 1000).getMonth(),
        year: new Date(doc.data()["date-time"]._seconds * 1000).getFullYear(),
        hour: new Date(doc.data()["date-time"]._seconds * 1000).getHours(),
        minutes: new Date(doc.data()["date-time"]._seconds * 1000).getMinutes(),
        name: doc.data().name,
        image: doc.data().image
    }]);
    
    if (limit) {
        old = old.slice(-limit)
        upcoming = upcoming.slice(0, limit)
    }
    
    context.res.status(200);
    context.res.send({
        old, upcoming
    })
}