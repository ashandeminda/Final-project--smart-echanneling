import hospitalModel from "../models/hospitalModel.js";

// GET ALL HOSPITALS
export const getHospitalsController = async (req, res) => {
    try {
        const hospitals = await hospitalModel.find({});
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: "Error fetching hospitals" });
    }
};

// CREATE HOSPITAL
export const createHospitalController = async (req, res) => {
    try {
        const { name, location, rating, image } = req.body;
        const newHospital = await hospitalModel.create({
            name,
            location,
            rating,
            image: req.file ? req.file.filename : (image || ""),
        });
        res.status(201).json({ message: "Hospital added", hospital: newHospital });
    } catch (error) {
        res.status(500).json({ message: "Error adding hospital" });
    }
};

// DELETE HOSPITAL
export const deleteHospitalController = async (req, res) => {
    try {
        await hospitalModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Hospital Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting hospital" });
    }
};

// UPDATE HOSPITAL
export const updateHospitalController = async (req, res) => {
    try {
        const updated = await hospitalModel.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                image: req.file ? req.file.filename : req.body.image,
            },
            { new: true }
        );
        res.json({ message: "Hospital Updated", hospital: updated });
    } catch (error) {
        res.status(500).json({ message: "Error updating hospital" });
    }
};
