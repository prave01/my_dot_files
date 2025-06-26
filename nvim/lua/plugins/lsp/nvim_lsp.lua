return {
	{
		"neovim/nvim-lspconfig",
		dependencies = {
			"williamboman/mason.nvim",
			"williamboman/mason-lspconfig.nvim",
		},
		config = function()
			require("mason").setup()
			require("mason-lspconfig").setup({ "ts_ls", "lua_ls" })

			local lspconfig = require("lspconfig")

			-- Enable LSP servers
		--	local servers = {
		--		"lua_ls",
		--		"ts_ls",
		--		"jsonls",
		--		"pyright",
		--		"luacheck",
		--		"tailwindcss-language-server",
		--	}
		--	for _, server in ipairs(servers) do
		--		lspconfig[server].setup({})
		--	end

			local on_attach = function(_, bufnr)
				local map = function(mode, lhs, rhs)
					vim.keymap.set(mode, lhs, rhs, { buffer = bufnr })
				end
				--map("n", "gd", vim.lsp.buf.definition)
				map("n", "gr", vim.lsp.buf.references)
				map("n", "K", vim.lsp.buf.hover)
			end

			local capabilities = vim.lsp.protocol.make_client_capabilities()
			capabilities.textDocument.completion.completionItem.snippetSupport = true

			local lspconfig = require("lspconfig")

			-- Css
			lspconfig.cssls.setup({
				onattach = onattach,
				capabilities = capabilities,
			})

			-- Python
			lspconfig.pyright.setup({
				onattach = onattach,
				capabilities = capabilities,
			})

			-- Tailwindcss
			lspconfig.tailwindcss.setup({
				root_dir = lspconfig.util.root_pattern(".git"),
				on_attach = on_attach,
				capabilities = capabilities,
			})

			-- HTML
			lspconfig.html.setup({
				on_attach = on_attach,
				capabilities = capabilities,
			})

			-- YAML
			lspconfig.yamlls.setup({
				on_attach = on_attach,
				capabilities = capabilities,
				settings = {
					yaml = {
						keyOrdering = false,
					},
				},
			})

			-- TypeScript
			lspconfig.ts_ls.setup({
				root_dir = lspconfig.util.root_pattern(".git"),
				single_file_support = false,
				on_attach = on_attach,
				capabilities = capabilities,
				settings = {
					typescript = {
						inlayHints = {
							includeInlayParameterNameHints = "literal",
							includeInlayParameterNameHintsWhenArgumentMatchesName = false,
							includeInlayFunctionParameterTypeHints = true,
							includeInlayVariableTypeHints = false,
							includeInlayPropertyDeclarationTypeHints = true,
							includeInlayFunctionLikeReturnTypeHints = true,
							includeInlayEnumMemberValueHints = true,
						},
					},
					javascript = {
						inlayHints = {
							includeInlayParameterNameHints = "all",
							includeInlayParameterNameHintsWhenArgumentMatchesName = false,
							includeInlayFunctionParameterTypeHints = true,
							includeInlayVariableTypeHints = true,
							includeInlayPropertyDeclarationTypeHints = true,
							includeInlayFunctionLikeReturnTypeHints = true,
							includeInlayEnumMemberValueHints = true,
						},
					},
				},
			})

			-- Lua
			lspconfig.lua_ls.setup({
				on_attach = on_attach,
				capabilities = capabilities,
				single_file_support = true,
				settings = {
					Lua = {
						workspace = {
							checkThirdParty = false,
						},
						completion = {
							workspaceWord = true,
							callSnippet = "Both",
						},
						hint = {
							enable = true,
							setType = false,
							paramType = true,
							paramName = "Disable",
							semicolon = "Disable",
							arrayIndex = "Disable",
						},
						doc = {
							privateName = { "^_" },
						},
						type = {
							castNumberToInteger = true,
						},
						diagnostics = {
							disable = { "incomplete-signature-doc", "trailing-space" },
							groupSeverity = {
								strong = "Warning",
								strict = "Warning",
							},
							groupFileStatus = {
								ambiguity = "Opened",
								await = "Opened",
								codestyle = "None",
								duplicate = "Opened",
								global = "Opened",
								luadoc = "Opened",
								redefined = "Opened",
								strict = "Opened",
								strong = "Opened",
								["type-check"] = "Opened",
								unbalanced = "Opened",
								unused = "Opened",
							},
							unusedLocalExclude = { "_*" },
						},
						format = {
							enable = false,
							defaultConfig = {
								indent_style = "space",
								indent_size = "2",
								continuation_indent_size = "2",
							},
						},
					},
				},
			})
		end,
	},
}
