local M = {}

function M.setup()
	local map = vim.keymap.set
	local opts = { noremap = true, silent = true }

	-- Switching tabs
	map("n", "<S-Tab>", ":BufferLineCycleNext<CR>", opts)
	-- Copy
  map("v", "<C-c>", '"+y')
end

return M
