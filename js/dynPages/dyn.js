import { Dyn } from "./Loader.js";
document.addEventListener("DOMContentLoaded", BootStrapDyn);
async function BootStrapDyn()
{
    let masterDyn = new Dyn();
    await masterDyn.InitDynPages();
}