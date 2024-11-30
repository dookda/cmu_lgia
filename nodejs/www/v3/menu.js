
const layer = `<li class="mb-2">
<button class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
    data-bs-toggle="collapse" data-bs-target="#maplayers-collapse" aria-expanded="true">
    ชั้นข้อมูลแผนที่
</button>
<div class="collapse show" id="maplayers-collapse">
    <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy-layers-collapse"
                aria-expanded="false">
                สำนักปลัดเทศบาล
            </button>
            <div class="collapse hide" id="deputy-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_operation-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายอำนวยการ
            </button>
            <div class="collapse hide" id="deputy_operation-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_operation">

                </ul>
            </div>
        </li>
        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_law-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายปกครองงานนิติการ
            </button>
            <div class="collapse hide" id="deputy_law-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_law">

                </ul>
            </div>
        </li>
        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_disaster-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายปกครองงานป้องกันบรรเทาสาธารณภัย
            </button>
            <div class="collapse hide" id="deputy_disaster-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_disaster">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_reg-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายปกครองงานทะเบียนราษฎร
            </button>
            <div class="collapse hide" id="deputy_reg-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_reg">

                </ul>
            </div>
        </li>
        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_community-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายพัฒนาชุมชน
            </button>
            <div class="collapse hide" id="deputy_community-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_community">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#treasury-layers-collapse"
                aria-expanded="false">
                กองคลัง
            </button>
            <div class="collapse hide" id="treasury-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="treasury">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#civil-layers-collapse"
                aria-expanded="false">
                กองช่าง
            </button>
            <div class="collapse hide" id="civil-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="civil">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#health-layers-collapse"
                aria-expanded="false">
                กองสาธารณสุขและสิ่งแวดล้อม
            </button>
            <div class="collapse hide" id="health-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="health">

                </ul>
            </div>
        </li>


        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#education-layers-collapse"
                aria-expanded="false">
                กองการศึกษา
            </button>
            <div class="collapse hide" id="education-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="education">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_policy-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายอำนวยการงานวิเคราะห์นโยบายและแผน
            </button>
            <div class="collapse hide" id="deputy_policy-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_policy">

                </ul>
            </div>
        </li>

        <li class="mb-1">
            <button class="btn btn-toggle1 d-inline-flex align-items-left rounded border-0"
                data-bs-toggle="collapse" data-bs-target="#deputy_travel-layers-collapse"
                aria-expanded="false">
                สำนักปลัดฝ่ายอำนวยการงานส่งเสริมการท่องเที่ยวและประชาสัมพันธ์
            </button>
            <div class="collapse hide" id="deputy_travel-layers-collapse">
                <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small" id="deputy_travel">

                </ul>
            </div>
        </li>

    </ul>
</div>
</li>`;

const menu = `<li class="mb-2">
        <a href="./../_report/index.html?page=_report"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            รายงาน
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_home/index.html?page=_home"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            ชั้นข้อมูลแผนที่
        </a>
    </li>
    <li class="mb-2">
            <a href="./../_doc/index.html?page=_doc"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                คู่มือการใช้งาน
            </a>
    </li>`;

const menuEditor = `<li class="mb-2">
    <a href="./../_report/index.html?page=_report"
        class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
        aria-expanded="false">
        รายงาน
    </a>
</li>

<li class="mb-2">
    <a href="./../_home/index.html?page=_home"
        class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
        aria-expanded="false">
        ชั้นข้อมูลแผนที่
    </a>
</li>

<li class="mb-2">
    <a href="./../_mapdb_upload/index.html?page=_mapdb_upload"
        class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
        aria-expanded="false">
        นำเข้าข้อมูลจาก CSV
    </a>
</li>

<li class="mb-2">
    <a href="./../_mapdb/index.html?page=_mapdb"
        class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
        aria-expanded="false">
        สร้างชั้นข้อมูล
    </a>
</li>

<li class="mb-2">
    <a href="./../_layer_list/index.html?page=_layer_list"
        class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
        aria-expanded="false">
        จัดการข้อมูล
    </a>
</li>
<li class="mb-2">
        <a href="./../_doc/index.html?page=_doc"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            คู่มือการใช้งาน
        </a>
</li>`;


const menuAdmin = `<li class="mb-2">
        <a href="./../_report/index.html?page=_report"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            รายงาน
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_home/index.html?page=_home"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            ชั้นข้อมูลแผนที่
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_mapdb_upload/index.html?page=_mapdb_upload"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            นำเข้าข้อมูลจาก CSV
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_mapdb/index.html?page=_mapdb"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            สร้างชั้นข้อมูล
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_layer_list/index.html?page=_layer_list"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            จัดการข้อมูล
        </a>
    </li>
    <li class="mb-2">
            <a href="./../_user/index.html?page=_user"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                จัดการผู้ใช้
            </a>
    </li>
    <li class="mb-2">
            <a href="./../_doc/index.html?page=_doc"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                คู่มือการใช้งาน
            </a>
    </li>`;

const menuWithLayer = `<li class="mb-2">
        <a href="./../_report/index.html?page=_report"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            รายงาน
        </a>
    </li>

    ${layer}
    <li class="mb-2">
            <a href="./../_doc/index.html?page=_doc"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                คู่มือการใช้งาน
            </a>
    </li>`;

const menuWithLayerEditor = `<li class="mb-2">
        <a href="./../_report/index.html?page=_report"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            รายงาน
        </a>
    </li>

    ${layer}

    <li class="mb-2">
        <a href="./../_mapdb_upload/index.html?page=_mapdb_upload"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            นำเข้าข้อมูลจาก CSV
        </a>
    </li>
    
    <li class="mb-2">
        <a href="./../_mapdb/index.html?page=_mapdb"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            สร้างชั้นข้อมูล
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_layer_list/index.html?page=_layer_list"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            จัดการข้อมูล
        </a>
    </li>
    <li class="mb-2">
            <a href="./../_doc/index.html?page=_doc"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                คู่มือการใช้งาน
            </a>
    </li>`;

const menuWithLayerAdmin = `<li class="mb-2">
        <a href="./../_report/index.html?page=_report"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            รายงาน
        </a>
    </li>

    ${layer}

    <li class="mb-2">
        <a href="./../_mapdb_upload/index.html?page=_mapdb_upload"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            นำเข้าข้อมูลจาก CSV
        </a>
    </li>
    
    <li class="mb-2">
        <a href="./../_mapdb/index.html?page=_mapdb"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            สร้างชั้นข้อมูล
        </a>
    </li>

    <li class="mb-2">
        <a href="./../_layer_list/index.html?page=_layer_list"
            class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
            aria-expanded="false">
            จัดการข้อมูล
        </a>
    </li>
    <li class="mb-2">
            <a href="./../_user/index.html?page=_user"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                จัดการผู้ใช้
            </a>
    </li>
    <li class="mb-2">
            <a href="./../_doc/index.html?page=_doc"
                class="btn btn-toggle d-inline-flex align-items-left rounded border-0"
                aria-expanded="false">
                คู่มือการใช้งาน
            </a>
    </li>`;

const header = `<header class="py-3 mb-2 border-bottom" style="background-color: #fd9927;">
<div class="container-fluid d-flex flex-wrap justify-content-center">
    <a href="./../index.html"
        class="d-flex align-items-center mb-3 mb-lg-0 me-lg-auto link-body-emphasis text-decoration-none">
        <img src="./../img/LOGO.png" width="70" height="70">
        <span class="fs-4"> &nbsp; ระบบภูมิสารสนเทศชุมชน (LGIA: Local Geo-Info Application)</span>
    </a>
    <ul class="nav" id='user'> </ul>
</div>
</header>`;

const footer = `<footer class="py-3 my-4">
    <div class="container-fluid">
        <hr>
        <p class="text-center text-muted">© 2024 ระบบภูมิสารสนเทศชุมชน</p>
    </div>
</footer>`;

// logout
const logout = async () => {
    try {
        // console.log('Logging out');
        document.cookie = "lgiatoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "lgiausername=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "lgiaauth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "lgiadivision=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = './../_login/index.html';
    }
    catch (error) {
        console.log('Failed to logout:', error);
    }
};

// get parameter from url
const getUrlParameter = () => {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    return params.get('page');
};

let getCookie = (cname) => {
    try {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    } catch (error) {
        console.log('Failed to get cookie:', error);
    }
}

// get tokenAccess from cookie
const getTokenAccess = async () => {
    try {
        let lgiatoken = getCookie('lgiatoken');
        let lgiausername = getCookie('lgiausername');
        let lgiaauth = getCookie('lgiaauth');
        let page = getUrlParameter();
        if (lgiatoken) {
            axios = axios.create({
                headers: {
                    'Authorization': `Bearer ${lgiatoken}`
                }
            });

            let response = await axios.post('/api/verify_token');

            if (response.data.status === 'success') {
                if (page == '_home') {
                    document.getElementById('header').innerHTML = header;
                    document.getElementById('listMenu').innerHTML = lgiaauth == "admin" ? menuWithLayerAdmin : lgiaauth == "editor" ? menuWithLayerEditor : menuWithLayer;
                    document.getElementById('footer').innerHTML = footer;
                } else {
                    document.getElementById('header').innerHTML = header;
                    document.getElementById('listMenu').innerHTML = lgiaauth == "admin" ? menuAdmin : lgiaauth == "editor" ? menuEditor : menu;
                    document.getElementById('footer').innerHTML = footer;
                }

                document.getElementById('user').innerHTML = `<li class="nav-item align-self-center ">
                    ${lgiausername}<br><small style="color: #f6e938; ">${lgiaauth}</small>
                </li>
                <li class="nav-item align-self-center">
                    <a href="./../_login/index.html" class="nav-link link-body-emphasis px-2" onclick="logout()"><span class="btn btn-warning">ออกจากระบบ</span></a>
                </li>`;
            } else {
                if (page == '_home') {
                    document.getElementById('header').innerHTML = header;
                    document.getElementById('listMenu').innerHTML = menuWithLayer;
                    document.getElementById('footer').innerHTML = footer;
                } else {
                    document.getElementById('header').innerHTML = header;
                    document.getElementById('listMenu').innerHTML = menu;
                    document.getElementById('footer').innerHTML = footer;
                }

                document.getElementById('user').innerHTML = `<li class="nav-item align-self-center">
                    <a href="./../_login/index.html" class="nav-link link-body-emphasis px-2" onclick="logout()"><span class="btn btn-warning">เข้าสู่ระบบ</span></a>
                </li>`;
            }

        } else {
            if (page == '_create' || page == '_mapdb' || page == '_mapdb_upload' || page == '_layer_list' || page == '_user') {
                // window.location.href = './../_login/index.html';
                logout();
            }

            // console.log('page:', page);
            if (page == '_home') {
                document.getElementById('header').innerHTML = header;
                document.getElementById('listMenu').innerHTML = menuWithLayer;
                document.getElementById('footer').innerHTML = footer;
            } else {
                document.getElementById('header').innerHTML = header;
                document.getElementById('listMenu').innerHTML = menu;
                document.getElementById('footer').innerHTML = footer;
            }

            document.getElementById('user').innerHTML = `<li class="nav-item align-self-center">
                <a href="./../_login/index.html" class="nav-link link-body-emphasis px-2" onclick="logout()"><span class="btn btn-warning">เข้าสู่ระบบ</span></a>
            </li>`;
        }

    } catch (error) {
        console.log('Failed to get tokenAccess:', error);
    }
};

setTimeout(() => {
    getTokenAccess();
}, 300);

