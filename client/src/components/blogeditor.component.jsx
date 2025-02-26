import { Link, useNavigate } from "react-router-dom";
import logo from "../imgs/logo.png";
import lightBanner from "../imgs/blog-banner-light.png";
import darkBanner from "../imgs/blog-banner-dark.png";
import BlogBanner from "../imgs/blogbanner.png";
import Animalwrapper from "../common/page-animation";
import { useContext, useEffect, } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { Editorcontext } from "../pages/editorpage";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { UserContext,ThemeContext} from "../App";

const BlogEditor = ({ token }) => {
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
    Editorstate,
  } = useContext(Editorcontext);

  let {userAuth :{access_token}} = useContext(UserContext)
  let {theme} = useContext(ThemeContext);

  let navigate = useNavigate();

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holder: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Let's Write an awsome story",
        })
      );
    }
  }, []);

  const handleBannerUpload = async (e) => {
    let img = e.target.files[0];
    if (img) {
      let loadingToast = toast.loading("uploading..");
      const formData = new FormData();
      formData.append("banner", img);

      try {
        console.log("token from prop: ", token);
        if (!token) {
          console.error("No access token found");
          return;
        }
        const response = await axios.post(
          "http://localhost:3005/upload-banner",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.banner_url) {
          toast.dismiss(loadingToast);
          toast.success("uploaded 👍");
          setBlog({ ...blog, banner: response.data.banner_url });
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        return toast.error(error);
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };

  const handleOnChange = (e) => {
    let input = e.target;

    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  const handleError = (e) => {
    let img =  e.target;
    img.src = theme == "light" ? lightBanner : darkBanner;
  }

  const handlePublishEvent = () => {
    if (!banner.length) {
      return toast.error("Upload a blog banner to publish it");
    }

    if (!title.length) {
      return toast.error("Add a title to your blog");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("write something in your blog to publish it");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Write the blog title before saving it as draft");
    }

    let loadingToast = toast.loading("Saving Draft....");

    e.target.classList.add("disable");

    if(textEditor.isReady){
      textEditor.save().then(content=>{
        let blogObj = {
          title,
          des,
          banner,
          content,
          tags,
          draft: true,
        };
    
        axios
          .post(import.meta.env.VITE_SERVER_HOST + "/create-blog", blogObj, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.success("Saved as Draft 👍!");
    
            setTimeout(() => {
              navigate("/");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
    
            return toast.error(response.data.error);
          });
      })
    }

    
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-40">
          <img src={logo} />
        </Link>
        <p className="max-mid:hidden line-clamp-1 text-black w-full">
          {title.length ? title : "New Blog"}
        </p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <Animalwrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-80 bf-white border-4 border-grey">
              <label htmlFor="uploadBanner">
                <img
                  src={banner}
                  className="z-20"
                  alt="Blog Banner"
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog-Title"
              className="text-4xl font-medium h-20 w-full outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleOnChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />
            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </Animalwrapper>
    </>
  );
};
export default BlogEditor;
