import mon from 'mongoose';

async function connect(){
    mon.connect(process.env.MON_URI).then(()=>{
        console.log("Connected to DB");
    }).catch(err=>{
        console.log("error arise in db.js")
    })
}

export default connect;