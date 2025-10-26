import axios from "axios";

(async () => {
    try {
        const res = await axios.get("https://api.coingecko.com/api/v3/coins/markets" , {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 5,
                page: 1,
                sparkline: false,
            },
        });

        console.log(" API accessible !");
        const data = res.data;
        console.log(data.slice(0, 2));
    } catch (err) {
        console.error(" Erreur d'accès API :", err.code, err.message);
    }
})();
