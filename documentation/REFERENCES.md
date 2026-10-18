# References

Sources used by One Bin: the dataset, the model and training methods, and the software it is built on.

## Dataset

1. **Kunwar, S.** (2026). *The Garbage Dataset (GD): A Multi-Class Image Benchmark for Automated Waste Segregation.* Journal of the Brazilian Computer Society, 32(1), 1676–1684. https://doi.org/10.5753/jbcs.2026.7774. Preprint: arXiv:2602.10500, https://doi.org/10.48550/arXiv.2602.10500
2. **Kunwar, S.** *Garbage Dataset* (garbage-classification-v2, version 12, `standardized_384` split). Kaggle. MIT License. https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2

   This is the 10-class training data (battery, biological, cardboard, clothes, glass, metal, paper, plastic, shoes, trash). Our copy has 12,259 images, matching the paper.

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

    This is the training data for the item detector (`prepare_taco.py` turns it into a single-class "item" YOLO dataset).
14. **Ultralytics.** *Ultralytics YOLO* (YOLO26-s, starting from COCO-pretrained `yolo26s.pt`). https://github.com/ultralytics/ultralytics. License: AGPL-3.0.

    This is the detector architecture and training framework (`train_detector.py`, `sorter.py`).
