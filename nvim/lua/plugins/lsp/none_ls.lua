return {
	-- None LS for linting
	{
		"nvimtools/none-ls.nvim",
		dependencies = {
			"nvimtools/none-ls-extras.nvim",
		},
		config = function()
			local null_ls = require("null-ls")
			local eslint_d = require("none-ls.diagnostics.eslint_d")
			null_ls.setup({
				sources = {
					-- Lua
					null_ls.builtins.formatting.stylua,

					-- Python
					null_ls.builtins.formatting.black,
					null_ls.builtins.formatting.isort,

					-- JS/TS
					null_ls.builtins.formatting.prettier, -- or use biome below

					-- Biome (optional alternative to Prettier + ESLint)
					null_ls.builtins.formatting.biome,

					-- Shellcheck
					--null_ls.builtins.diagnostics.shellcheck,

					--null_ls.builtins.diagnostics.biome,
				},
			})

			-- Keymap Space-f
			vim.keymap.set("n", "<leader>f", function()
				vim.lsp.buf.format({ async = true })
			end, {})
		end,
	},
}
