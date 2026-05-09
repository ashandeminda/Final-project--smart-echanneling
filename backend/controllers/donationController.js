import donationModel from "../models/donationModel.js";

export const createDonationController = async (req, res) => {
    try {
        const { name, amount, paymentMethod, isAnonymous, campaignKey } = req.body;
        const donation = await donationModel.create({
            name: isAnonymous ? "Anonymous" : (name || "Anonymous"),
            isAnonymous: Boolean(isAnonymous),
            campaignKey: campaignKey || "general",
            amount,
            paymentMethod,
            status: "completed", // Mocking completion immediately for now
        });

        res.status(201).json({ message: "Donation successful", donation });
    } catch (error) {
        res.status(500).json({ message: "Error processing donation" });
    }
};

export const getDonationsController = async (req, res) => {
    try {
        const donations = await donationModel
            .find({ status: "completed" })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching donations" });
    }
};

export const getDonationStatsController = async (req, res) => {
    try {
        const completedDonations = await donationModel.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$campaignKey",
                    totalRaised: { $sum: "$amount" },
                    donationsCount: { $sum: 1 },
                },
            },
        ]);

        const byCampaign = completedDonations.reduce((acc, item) => {
            acc[item._id || "general"] = {
                totalRaised: item.totalRaised,
                donationsCount: item.donationsCount,
            };
            return acc;
        }, {});

        const totals = completedDonations.reduce(
            (acc, item) => {
                acc.totalRaised += item.totalRaised;
                acc.donationsCount += item.donationsCount;
                return acc;
            },
            { totalRaised: 0, donationsCount: 0 }
        );

        res.json({
            success: true,
            totals,
            byCampaign,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching donation stats" });
    }
};

export const getAdminDonationsController = async (req, res) => {
    try {
        const donations = await donationModel
            .find({ status: "completed" })
            .sort({ createdAt: -1 })
            .limit(100)
            .select("-__v");

        const completedDonations = await donationModel.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$campaignKey",
                    totalRaised: { $sum: "$amount" },
                    donationsCount: { $sum: 1 },
                },
            },
        ]);

        const byCampaign = completedDonations.reduce((acc, item) => {
            acc[item._id || "general"] = {
                totalRaised: item.totalRaised,
                donationsCount: item.donationsCount,
            };
            return acc;
        }, {});

        const totals = completedDonations.reduce(
            (acc, item) => {
                acc.totalRaised += item.totalRaised;
                acc.donationsCount += item.donationsCount;
                return acc;
            },
            { totalRaised: 0, donationsCount: 0 }
        );

        res.json({
            success: true,
            totals,
            byCampaign,
            donations,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching admin donations" });
    }
};
