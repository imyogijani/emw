import AttributeRule from "../models/attributeRuleModel.js";
import Category from "../models/categoryModel.js";

export const getAttributesBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const rules = await AttributeRule.findOne({ subCategoryId });

    // Always mandatory fields
    const baseFields = [
      { key: "title", label: "Title", type: "string", required: true },
      {
        key: "weight",
        label: "Weight (grams)",
        type: "number",
        required: true,
      },
      {
        key: "dimensions",
        label: "Dimensions",
        type: "object",
        required: true,
      },
    ];

    if (!rules) {
      // If no rules defined, just return mandatory fields
      return res.json(baseFields);
    }

    res.json([...baseFields, ...rules.fields]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrUpdateAttributeRule = async (req, res) => {
  try {
    const { subCategoryId, fields } = req.body;

    // ✅ Validate subcategory
    const category = await Category.findById(subCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    if (!category.parent) {
      return res.status(400).json({
        message:
          "Cannot create rules for main category. Please select a subcategory.",
      });
    }

    // Check if rule already exists
    let rule = await AttributeRule.findOne({ subCategoryId });

    if (rule) {
      // Update existing
      rule.fields = fields;
      await rule.save();
    } else {
      // Create new
      rule = await AttributeRule.create({ subCategoryId, fields });
    }

    res.status(201).json({
      message: "Attribute rules saved successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin :
export const getAttributeRule = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const rule = await AttributeRule.findOne({ subCategoryId });

    if (!rule) {
      return res.status(404).json({ message: "No rules found" });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
