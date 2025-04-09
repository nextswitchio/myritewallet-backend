const { BulkTemplate, TemplateVersion } = require('../models');
const sequelize = require('sequelize');
const vfdService = require('../services/vfdService');

module.exports = {
  // Create a new template
  createTemplate: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { name, description, template } = req.body;

      // Validate input
      if (!name || !template) {
        await t.rollback();
        return res.status(400).json({ error: 'Name and template data are required' });
      }

      // Create template
      const newTemplate = await BulkTemplate.create({
        name,
        description,
        creatorId: req.user.id
      }, { transaction: t });

      // Initial version
      await TemplateVersion.create({
        version: '1.0',
        templateData: template,
        isActive: true,
        creatorId: req.user.id,
        bulkTemplateId: newTemplate.id
      }, { transaction: t });

      await t.commit();
      res.status(201).json(newTemplate);
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Update an existing template
  updateTemplate: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { changes, reason } = req.body;

      // Validate input
      if (!changes || Object.keys(changes).length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Changes are required to update the template' });
      }

      // Get current version
      const current = await TemplateVersion.findOne({
        where: { 
          bulkTemplateId: id,
          isActive: true 
        },
        transaction: t
      });

      if (!current) {
        await t.rollback();
        return res.status(404).json({ error: 'Active template version not found' });
      }

      // Create new version
      const newVersion = await TemplateVersion.create({
        version: incrementVersion(current.version),
        templateData: { ...current.templateData, ...changes },
        changeReason: reason,
        creatorId: req.user.id,
        bulkTemplateId: id
      }, { transaction: t });

      // Initiate approval if major change
      if (isMajorChange(current.templateData, newVersion.templateData)) {
        await vfdService.initiateApprovalFlow(
          `template_update_${newVersion.id}`,
          'template_change',
          {
            templateId: id,
            versionFrom: current.version,
            versionTo: newVersion.version,
            changes
          }
        );
      } else {
        // Auto-activate minor changes
        await current.update({ isActive: false }, { transaction: t });
        await newVersion.update({ isActive: true }, { transaction: t });
      }

      await t.commit();
      res.json(newVersion);
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get all templates with their active versions
  getTemplates: async (req, res) => {
    try {
      const templates = await BulkTemplate.findAll({
        include: [
          {
            model: TemplateVersion,
            as: 'versions',
            where: { isActive: true },
            attributes: ['id', 'version', 'templateData', 'isActive']
          }
        ]
      });

      res.json(templates);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get a specific template by ID
  getTemplateById: async (req, res) => {
    try {
      const { id } = req.params;

      const template = await BulkTemplate.findByPk(id, {
        include: [
          {
            model: TemplateVersion,
            as: 'versions',
            attributes: ['id', 'version', 'templateData', 'isActive', 'changeReason', 'createdAt']
          }
        ]
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Delete a template (soft delete)
  deleteTemplate: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;

      const template = await BulkTemplate.findByPk(id, { transaction: t });
      if (!template) {
        await t.rollback();
        return res.status(404).json({ error: 'Template not found' });
      }

      // Soft delete the template
      await template.update({ isActive: false }, { transaction: t });

      await t.commit();
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  }
};

// Helper function to determine if a change is major
function isMajorChange(oldData, newData) {
  // Implement business rules for major vs minor changes
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

// Helper function to increment version
function incrementVersion(version) {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}`;
}