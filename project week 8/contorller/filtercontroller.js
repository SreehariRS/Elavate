const orders = require("../models/order")

const fetchGraphData = async (duration) => {
    try {
        const initialDate = new Date(new Date().getTime() - duration * 24 * 60 * 60 * 1000);
        const data = await orders.aggregate([
            {
                $match: {
                    date: {
                        $gte: initialDate,
                        $lt: new Date(2024, 0, 1) // Corrected year format
                    }
                }
            },
            {
                $unwind: "$items" // Unwind 'items' array
            },
            {
                $group: {
                    _id: "$items.status",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    label: "$_id",
                    value: "$count"
                }
            },
            {
                $sort: {
                    label: 1
                }
            }
        ]);

        return data;
    } catch (error) {
        throw error;
    }
};

const handleGraphRequest = async (req, res, graphType) => {
    try {
        const filter = req.query.filter;
        console.log(filter, "filter");
        const duration = {
            day: 1,
            week: 7,
            month: 28,
            year: 365
        };
        const data = await fetchGraphData(duration[filter]);
        console.log("dataaaa", data);
        res.json(data);
    } catch (error) {
        console.error(`Error fetching ${graphType} data:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
};



const doughnutGraph = async (req, res) => {
    try {
        const topSellingProducts = await getTopSellingProducts();
        console.log("ggggggggggggggggggggg",topSellingProducts);
        res.json(topSellingProducts);
    } catch (error) {
        console.error("Error fetching top selling products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getTopSellingProducts = async () => {
    try {
        const topSellingProducts = await orders.aggregate([
            { $unwind: "$items" }, // Unwind 'items' array
            { $group: { _id: "$items.productId", count: { $sum: "$items.quantity" } } }, // Group by productId and sum quantity
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, // Lookup product details
            { $project: { _id: 1, name: { $arrayElemAt: ["$product.name", 0] }, count: 1 } }, // Include product name in projection
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]);
        return topSellingProducts;
    } catch (error) {
        throw error;
    }
};

const doughnutGraph2 = async (req, res) => {
    try {
        const topSellingCategory = await getTopSellingCategories();
        res.json(topSellingCategory);
    } catch (error) {
        console.error("Error fetching top selling categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getTopSellingCategories = async () => {
    try {
        const topSellingCategories = await orders.aggregate([
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { _id: "$product.category", count: { $sum: "$items.quantity" } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        return topSellingCategories;
    } catch (error) {
        throw error;
    }
};


module.exports = {

    doughnutGraph,
    doughnutGraph2
};
