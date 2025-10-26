import axios from "axios";

(async () => {
    try {
        const res = await axios.get("https://api.coincap.io/v2/assets");
        console.log(" API accessible !");
        console.log(res.data.data.slice(0, 2));
    } catch (err) {
        console.error(" Erreur d'accès API :", err.code, err.message);
    }
})();
