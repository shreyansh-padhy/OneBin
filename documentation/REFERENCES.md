# References

Sources used by One Bin: the dataset, the model and training methods, and the software it is built on.

## Dataset

1. **Kunwar, S.** (2026). *The Garbage Dataset (GD): A Multi-Class Image Benchmark for Automated Waste Segregation.* Journal of the Brazilian Computer Society, 32(1), 1676–1684. https://doi.org/10.5753/jbcs.2026.7774. Preprint: arXiv:2602.10500, https://doi.org/10.48550/arXiv.2602.10500
2. **Kunwar, S.** *Garbage Dataset* (garbage-classification-v2, version 12, `standardized_384` split). Kaggle. MIT License. https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2

   This is the 10-class training data (battery, biological, cardboard, clothes, glass, metal, paper, plastic, shoes, trash). Our copy has 12,259 images, matching the paper.

### Additional datasets (merged by `import_data.py` into `data/combined*/`)

These are relabeled onto One Bin's classes with Seattle disposal rules; per-source licenses are also written to `data/combined*/SOURCES.md`.

- **King, A.** *Recyclable and Household Waste Classification.* Kaggle. https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification — 30 item classes (cans, plastic bags, food waste, styrofoam, …); file prefix `hw__`.
- **Single, S., Iranmanesh, S., & Raad, R.** (2023). *RealWaste: A Novel Real-Life Data Set for Landfill Waste Classification Using Deep Learning.* Information, 14(12), 633. https://doi.org/10.3390/info14120633. Data: UCI Machine Learning Repository, https://archive.ics.uci.edu/dataset/908/realwaste. **License: CC BY-NC-SA 4.0 (non-commercial)** — rebuild with `--skip rw` for commercial use. File prefix `rw__`.
- **Nnamoko, N., Barrowclough, J., & Procter, J.** (2022). *Solid Waste Image Classification Using Deep Convolutional Neural Network.* Infrastructures, 7(4), 47. https://doi.org/10.3390/infrastructures7040047. Dataset: *Waste Classification Dataset*, Mendeley Data, https://doi.org/10.17632/n3gtgm9jxj.3 (CC BY 4.0), a cleaned version of **Sekar, S.** *Waste Classification Data*, Kaggle, https://www.kaggle.com/datasets/techsash/waste-classification-data. Only the organic class is used; file prefix `eh__`.
- **TACO** (reference 13 below) item crops for the classifier: each annotated item is cut out of its photo and mapped to a One Bin class (`TACO_MAP` in `import_data.py`); file prefix `taco__`, and crops keep their photo's train/val/test split.

## Model

3. **Tan, M., & Le, Q. V.** (2021). *EfficientNetV2: Smaller Models and Faster Training.* Proceedings of the 38th International Conference on Machine Learning (ICML), PMLR 139, 10096–10106. https://arxiv.org/abs/2104.00298

   This is the backbone architecture (`efficientnet_v2_s`).
4. **Deng, J., Dong, W., Socher, R., Li, L.-J., Li, K., & Fei-Fei, L.** (2009). *ImageNet: A Large-Scale Hierarchical Image Database.* IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 248–255. https://doi.org/10.1109/CVPR.2009.5206848

   This is the source of the pretrained weights (`IMAGENET1K_V1`) and the normalization mean and std.

## Training methods

5. **Loshchilov, I., & Hutter, F.** (2019). *Decoupled Weight Decay Regularization.* International Conference on Learning Representations (ICLR). https://arxiv.org/abs/1711.05101

   This is the AdamW optimizer.
6. **Smith, L. N., & Topin, N.** (2019). *Super-Convergence: Very Fast Training of Neural Networks Using Large Learning Rates.* Proc. SPIE 11006, Artificial Intelligence and Machine Learning for Multi-Domain Operations Applications. https://arxiv.org/abs/1708.07120

   This is the one-cycle learning-rate schedule (`OneCycleLR`).
7. **Szegedy, C., Vanhoucke, V., Ioffe, S., Shlens, J., & Wojna, Z.** (2016). *Rethinking the Inception Architecture for Computer Vision.* IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 2818–2826. https://arxiv.org/abs/1512.00567

   This is label smoothing (ε = 0.1).
8. **Micikevicius, P., et al.** (2018). *Mixed Precision Training.* International Conference on Learning Representations (ICLR). https://arxiv.org/abs/1710.03740

   This is automatic mixed precision with loss scaling (`autocast` and `GradScaler`).

## Software

9. **Paszke, A., et al.** (2019). *PyTorch: An Imperative Style, High-Performance Deep Learning Library.* Advances in Neural Information Processing Systems 32 (NeurIPS), 8024–8035. https://arxiv.org/abs/1912.01703
10. **TorchVision maintainers and contributors** (2016). *TorchVision: PyTorch's Computer Vision library.* https://github.com/pytorch/vision

    This provides the model zoo, pretrained weights, transforms and `ImageFolder`.
11. **Abid, A., Abdalla, A., Abid, A., Khan, D., Alfozan, A., & Zou, J.** (2019). *Gradio: Hassle-Free Sharing and Testing of ML Models in the Wild.* arXiv:1906.02569. https://arxiv.org/abs/1906.02569

    This is the web demo UI in `app.py`.
12. **Kaggle.** *kagglehub: Python client for Kaggle resources.* https://github.com/Kaggle/kagglehub

    This is used to download the dataset.

## Multi-object detection

13. **Proença, P. F., & Simões, P.** (2020). *TACO: Trash Annotations in Context for Litter Detection.* arXiv:2003.06975. https://arxiv.org/abs/2003.06975. Dataset: http://tacodataset.org. License: CC BY 4.0.

    This is the training data for the item detector (`prepare_taco.py` turns it into a single-class "item" YOLO dataset), and the source of the classifier's real-world item crops (see Additional datasets).
14. **Ultralytics.** *Ultralytics YOLO* (YOLO26-s, starting from COCO-pretrained `yolo26s.pt`). https://github.com/ultralytics/ultralytics. License: AGPL-3.0.

    This is the detector architecture and training framework (`train_detector.py`, `sorter.py`).
