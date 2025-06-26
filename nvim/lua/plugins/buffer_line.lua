return {
	{
		"akinsho/bufferline.nvim",
		version = "*",
		dependencies = { "nvim-tree/nvim-web-devicons" },
		config = function()
			vim.opt.termguicolors = true
			local bufferline = require("bufferline")

			bufferline.setup({
				options = {
					mode = "buffers",
					style_preset = bufferline.style_preset.default,
					themable = false,
					close_command = "<C-w>",
					indicator = {
						icon = " 🙋🏽‍♂️ ",
						style = "icon",
					},
					buffer_close_icon = "⚔️ ",
					modified_icon = "👋🏻",
					close_icon = "⚔️",
					left_trunc_marker = "⬅️",
					right_trunc_marker = "➡️",
					max_name_length = 15,
					max_prefix_length = 10,
					truncate_names = true,
					tab_size = 18,
					diagnostics = "nvim_lsp",
					diagnostics_update_on_event = true,
					diagnostics_indicator = function(count, level, diagnostics_dict, context)
						return "(" .. count .. ")"
					end,
					-- offsets = {
					--   {
					--     filetype = "NvimTree",
					--     text = "File Explorer",
					--     text_align = "right",
					--     separator = true,
					--   },
					-- },
					color_icons = true,
					get_element_icon = function(element)
						local icon, hl =
							require("nvim-web-devicons").get_icon_by_filetype(element.filetype, { default = false })
						return icon, hl
					end,
					--separator_style = "slope",
					always_show_bufferline = true,
					auto_toggle_bufferline = true,
					sort_by = "insert_after_current",
					pick = {
						alphabet = "abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMOPQRSTUVWXYZ1234567890",
					},
				},
			})
		end,
	},
}
