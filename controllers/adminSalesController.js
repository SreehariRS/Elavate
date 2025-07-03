const Order = require("../models/order");
const User = require("../models/usermodel");
const Product = require("../models/product");
const Category = require("../models/category");

const sales = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query for orders
        let query = { status: "delivered" };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Fetch delivered orders
        const orders = await Order.find(query).populate("items.productId");

        // Calculate total amount and total orders
        const totalAmount = orders.reduce((sum, order) => sum + order.totalprice, 0);
        const totalOrders = orders.length;

        // Fetch total users and products
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        // Prepare sales report data
        const salesReport = orders.flatMap((order) =>
            order.items.map((item) => ({
                proname: item.productId ? item.productId.name : "N/A",
                address: order.selectedAddress || "Address Not Available",
                createdAt: order.date.toLocaleDateString(),
                quantity: item.quantity,
                price: item.productId ? item.productId.offerprice || item.productId.price : 0,
                totalprice: order.totalprice,
                paymentMethod: order.paymentMethod || "N/A",
            }))
        );

        // Prepare data object for overview
        const data = {
            totalAmount,
            totalOrders,
            user: totalUsers,
            product: totalProducts,
        };

        res.render("admin/salesReport", { data, salesReport });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).send("Internal Server Error");
    }
};

const generatePDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = { status: "delivered" };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const orders = await Order.find(query).populate("items.productId");

        const salesReport = orders.flatMap((order) =>
            order.items.map((item, index) => ({
                slNo: index + 1,
                proname: item.productId ? item.productId.name : "N/A",
                address: order.selectedAddress || "Address Not Available",
                createdAt: order.date.toLocaleDateString(),
                quantity: item.quantity,
                price: item.productId ? item.productId.offerprice || item.productId.price : 0,
                totalprice: order.totalprice,
                paymentMethod: order.paymentMethod || "N/A",
            }))
        );

        const totalAmount = orders.reduce((sum, order) => sum + order.totalprice, 0);
        const totalOrders = orders.length;
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        const docDefinition = {
            content: [
                { text: "Sales Report", style: "header" },
                {
                    text: startDate && endDate ? `From: ${startDate} To: ${endDate}` : "All Time",
                    style: "subheader",
                },
                {
                    style: "overview",
                    text: [
                        `Total Sales Amount: ₹${totalAmount}\n`,
                        `Total Orders: ${totalOrders}\n`,
                        `Total Users: ${totalUsers}\n`,
                        `Total Products: ${totalProducts}\n`,
                    ],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto", "auto"],
                        body: [
                            ["Sl No", "Product Name", "User Details", "Date", "Quantity", "Offer Price", "Original Price", "Payment Method"],
                            ...salesReport.map((report) => [
                                report.slNo,
                                report.proname,
                                report.address,
                                report.createdAt,
                                report.quantity,
                                report.price,
                                `₹${report.totalprice}`,
                                report.paymentMethod,
                            ]),
                        ],
                    },
                },
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, margin: [0, 10, 0, 10] },
                overview: { fontSize: 12, margin: [0, 10, 0, 10] },
            },
        };

        const pdfDoc = require("pdfmake/build/pdfmake");
        const pdfFonts = require("pdfmake/build/vfs_fonts");
        pdfDoc.vfs = pdfFonts.pdfMake.vfs;

        const pdf = pdfDoc.createPdfKitDocument(docDefinition);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
        pdf.pipe(res);
        pdf.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Internal Server Error");
    }
};

const downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        let query = { status: "delivered" };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const orders = await Order.find(query).populate("items.productId");

        const salesReport = orders.flatMap((order) =>
            order.items.map((item, index) => ({
                slNo: index + 1,
                proname: item.productId ? item.productId.name : "N/A",
                address: order.selectedAddress || "Address Not Available",
                createdAt: order.date.toLocaleDateString(),
                quantity: item.quantity,
                price: item.productId ? item.productId.offerprice || item.productId.price : 0,
                totalprice: order.totalprice,
                paymentMethod: order.paymentMethod || "N/A",
            }))
        );

        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
            { header: "Sl No", key: "slNo", width: 10 },
            { header: "Product Name", key: "proname", width: 20 },
            { header: "User Details", key: "address", width: 30 },
            { header: "Date", key: "createdAt", width: 15 },
            { header: "Quantity", key: "quantity", width: 10 },
            { header: "Offer Price", key: "price", width: 15 },
            { header: "Original Price", key: "totalprice", width: 15 },
            { header: "Payment Method", key: "paymentMethod", width: 15 },
        ];

        salesReport.forEach((report) => {
            worksheet.addRow({
                slNo: report.slNo,
                proname: report.proname,
                address: report.address,
                createdAt: report.createdAt,
                quantity: report.quantity,
                price: report.price,
                totalprice: `₹${report.totalprice}`,
                paymentMethod: report.paymentMethod,
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(500).send("Internal Server Error");
    }
};

const home = async (req, res) => {
    try {
        // Fetch delivered orders
        const orders = await Order.find({ status: "delivered" }).populate("items.productId");

        // Calculate total amount and total orders
        const totalAmount = orders.reduce((sum, order) => sum + order.totalprice, 0);
        const totalOrders = orders.length;

        // Fetch total users and products
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        // Calculate top-selling products
        const productSales = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                if (item.productId) {
                    const productId = item.productId._id.toString();
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            name: item.productId.name,
                            totalQuantity: 0,
                        };
                    }
                    productSales[productId].totalQuantity += item.quantity;
                }
            });
        });

        // Convert to array and sort by total quantity (descending)
        const topSellingProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 5); // Limit to top 5 products

        // Calculate top-selling categories
        const categorySales = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                if (item.productId && item.productId.category) {
                    const categoryName = item.productId.category;
                    if (!categorySales[categoryName]) {
                        categorySales[categoryName] = {
                            _id: categoryName, // Use category name as _id for consistency with home.ejs
                            count: 0,
                        };
                    }
                    categorySales[categoryName].count += item.quantity;
                }
            });
        });

        // Convert to array and sort by total quantity (descending)
        const topSellingCategories = Object.values(categorySales)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Limit to top 5 categories

        // Prepare data object for overview
        const data = {
            totalAmount,
            totalOrders,
            user: totalUsers,
            product: totalProducts,
        };

        res.render("admin/home", { data, topSellingProducts, topSellingCategories });
    } catch (error) {
        console.error("Error rendering home:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    sales,
    generatePDF,
    downloadExcel,
    home,
};